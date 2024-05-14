import datetime

from django.db import transaction
from django.utils.translation import gettext_lazy as _

from actions.recurring_reservation import ReservationDetails
from applications.choices import ApplicantTypeChoice, Weekday
from applications.models import AllocatedTimeSlot
from common.utils import translate_for_user
from opening_hours.utils.reservable_time_span_client import ReservableTimeSpanClient
from opening_hours.utils.time_span_element import TimeSpanElement
from reservations.choices import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from reservations.models import RecurringReservation
from tilavarauspalvelu.celery import app
from utils.sentry import SentryLogger


@app.task(name="generate_reservation_series_from_allocations")
@SentryLogger.log_if_raises("Failed to generate reservation series from allocations", re_raise=True)
def generate_reservation_series_from_allocations(application_round_id: int) -> None:
    allocations = AllocatedTimeSlot.objects.filter(
        reservation_unit_option__application_section__application__application_round=application_round_id,
    ).select_related(
        "reservation_unit_option__reservation_unit__origin_hauki_resource",
        "reservation_unit_option__application_section__application__application_round",
    )

    # Find all closed opening hours for all reservation units where allocations were made.
    # Check against these and not fully normalized opening hours since allocations can be made
    # outside opening hours (as this system defines them), but should not be on explicitly
    # closed hours, like holidays.
    closed_time_spans: dict[int, list[TimeSpanElement]] = {}
    for allocation in allocations:
        resource = allocation.reservation_unit_option.reservation_unit.origin_hauki_resource
        if resource is None or resource.id in closed_time_spans:
            continue

        application_round = allocation.reservation_unit_option.application_section.application.application_round
        closed_time_spans[resource.id] = ReservableTimeSpanClient(resource).get_closed_time_spans(
            start_date=application_round.reservation_period_begin,
            end_date=application_round.reservation_period_end,
        )

    recurring_reservations: list[RecurringReservation] = [
        RecurringReservation(
            name=allocation.reservation_unit_option.application_section.name,
            description=translate_for_user(
                _("Seasonal Booking"),
                allocation.reservation_unit_option.application_section.application.user,
            ),
            begin_date=allocation.reservation_unit_option.application_section.reservations_begin_date,
            begin_time=allocation.begin_time,
            end_date=allocation.reservation_unit_option.application_section.reservations_end_date,
            end_time=allocation.end_time,
            recurrence_in_days=7,
            weekdays=str(Weekday(allocation.day_of_the_week).as_weekday_number),
            reservation_unit=allocation.reservation_unit_option.reservation_unit,
            user=allocation.reservation_unit_option.application_section.application.user,
            allocated_time_slot=allocation,
            age_group=allocation.reservation_unit_option.application_section.age_group,
        )
        for allocation in allocations
    ]

    with transaction.atomic():
        recurring_reservations = RecurringReservation.objects.bulk_create(recurring_reservations)
        for recurring_reservation in recurring_reservations:
            resource = recurring_reservation.reservation_unit.origin_hauki_resource
            slots = recurring_reservation.actions.pre_calculate_slots(
                check_start_interval=True,
                closed_hours=closed_time_spans.get(resource.id),
            )

            allocated_time_slot = recurring_reservation.allocated_time_slot
            reservation_unit_option = allocated_time_slot.reservation_unit_option
            application_section = reservation_unit_option.application_section
            application = application_section.application
            application_round = application.application_round

            reservation_details = ReservationDetails(
                name=recurring_reservation.name,
                description=application.additional_information,
                type=ReservationTypeChoice.SEASONAL,
                state=ReservationStateChoice.CONFIRMED,
                user=recurring_reservation.user,
                handled_at=application_round.handled_date,
                num_persons=application_section.num_persons,
                buffer_time_before=datetime.timedelta(0),
                buffer_time_after=datetime.timedelta(0),
                reservee_first_name=application.contact_person.first_name,
                reservee_last_name=application.contact_person.last_name,
                reservee_email=application.contact_person.email,
                reservee_phone=application.contact_person.phone_number,
                billing_address_street=application.billing_address.street_address,
                billing_address_city=application.billing_address.city,
                billing_address_zip=application.billing_address.post_code,
            )

            reservation_details["reservee_type"] = (
                CustomerTypeChoice.INDIVIDUAL
                if application.applicant_type == ApplicantTypeChoice.INDIVIDUAL
                else CustomerTypeChoice.BUSINESS
                if application.applicant_type == ApplicantTypeChoice.COMPANY
                else CustomerTypeChoice.NONPROFIT
            )

            if reservation_details["reservee_type"] == CustomerTypeChoice.INDIVIDUAL:
                reservation_details["reservee_address_street"] = application.billing_address.street_address
                reservation_details["reservee_address_city"] = application.billing_address.city
                reservation_details["reservee_address_zip"] = application.billing_address.post_code

            else:
                reservation_details["reservee_organisation_name"] = application.organisation.name
                reservation_details["reservee_id"] = application.organisation.identifier
                reservation_details["reservee_is_unregistered_association"] = (
                    application.organisation.identifier is None
                )
                reservation_details["reservee_address_street"] = application.organisation.address.street_address
                reservation_details["reservee_address_city"] = application.organisation.address.city
                reservation_details["reservee_address_zip"] = application.organisation.address.post_code

            recurring_reservation.actions.bulk_create_reservation_for_periods(
                periods=slots.possible,
                reservation_details=reservation_details,
            )
