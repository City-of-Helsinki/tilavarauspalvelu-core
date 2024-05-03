import datetime

from django.db import transaction
from django.utils.translation import gettext_lazy as _

from actions.recurring_reservation import ReservationDetails
from applications.choices import ApplicantTypeChoice, Weekday
from applications.models import AllocatedTimeSlot
from common.utils import translate_for_user
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
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

    # Update the reservable times for all reservation units where allocations were made
    origin_ids: set[int] = {
        allocation.reservation_unit_option.reservation_unit.origin_hauki_resource.id for allocation in allocations
    }
    HaukiResourceHashUpdater(list(origin_ids)).run()

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
            slots = recurring_reservation.actions.pre_calculate_slots(
                check_opening_hours=True,
                check_start_interval=True,
                check_buffers=False,
            )

            allocated_time_slot = recurring_reservation.allocated_time_slot
            reservation_unit_option = allocated_time_slot.reservation_unit_option
            application_section = reservation_unit_option.application_section
            application = application_section.application
            application_round = application.application_round

            common_details = ReservationDetails(
                name=recurring_reservation.name,
                description=application.additional_information,
                type=ReservationTypeChoice.SEASONAL,
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

            common_details["reservee_type"] = (
                CustomerTypeChoice.INDIVIDUAL
                if application.applicant_type == ApplicantTypeChoice.INDIVIDUAL
                else CustomerTypeChoice.BUSINESS
                if application.applicant_type == ApplicantTypeChoice.COMPANY
                else CustomerTypeChoice.NONPROFIT
            )

            if common_details["reservee_type"] == CustomerTypeChoice.INDIVIDUAL:
                common_details["reservee_address_street"] = application.billing_address.street_address
                common_details["reservee_address_city"] = application.billing_address.city
                common_details["reservee_address_zip"] = application.billing_address.post_code

            else:
                common_details["reservee_organisation_name"] = application.organisation.name
                common_details["reservee_id"] = application.organisation.identifier
                common_details["reservee_is_unregistered_association"] = application.organisation.identifier is None
                common_details["reservee_address_street"] = application.organisation.address.street_address
                common_details["reservee_address_city"] = application.organisation.address.city
                common_details["reservee_address_zip"] = application.organisation.address.post_code

            recurring_reservation.actions.bulk_create_reservation_for_periods(
                periods=slots.possible,
                reservation_details=(
                    common_details
                    | ReservationDetails(
                        state=ReservationStateChoice.CONFIRMED,
                    )
                ),
            )
            recurring_reservation.actions.bulk_create_reservation_for_periods(
                periods=slots.not_possible,
                reservation_details=(
                    common_details
                    | ReservationDetails(
                        state=ReservationStateChoice.DENIED,
                    )
                ),
            )
