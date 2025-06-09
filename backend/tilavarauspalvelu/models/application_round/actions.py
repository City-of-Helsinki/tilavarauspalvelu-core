from __future__ import annotations

import dataclasses
import datetime
from contextlib import suppress
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from lookup_property import L

from tilavarauspalvelu.enums import (
    ApplicantTypeChoice,
    ApplicationRoundStatusChoice,
    CustomerTypeChoice,
    HaukiResourceState,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.exceptions import ApplicationRoundResetError
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.models import (
    AllocatedTimeSlot,
    Application,
    ApplicationSection,
    Reservation,
    ReservationSeries,
    ReservationUnitOption,
)
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task, update_affecting_time_spans_task
from tilavarauspalvelu.translation import translate_for_user
from tilavarauspalvelu.typing import ReservationDetails
from utils.date_utils import local_end_of_day, local_start_of_day

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound


__all__ = [
    "ApplicationRoundActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationRoundActions:
    application_round: ApplicationRound

    def reset_application_round_allocation(self) -> None:
        """
        Remove application round allocations, and unlock locked reservation unit options.
        Rejected options stay rejected.
        """
        match self.application_round.status:
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                # Unlock all reservation unit options, and remove all allocated time slots
                ReservationUnitOption.objects.for_application_round(self.application_round).update(is_locked=False)
                AllocatedTimeSlot.objects.for_application_round(self.application_round).delete()

            case ApplicationRoundStatusChoice.HANDLED:
                # Check if there are any Pindora access codes and delete them before deleting the reservations
                sections = ApplicationSection.objects.filter(
                    L(should_have_active_access_code=True),
                    application__application_round=self.application_round,
                )

                for section in sections:
                    with suppress(PindoraNotFoundError):
                        PindoraService.delete_access_code(obj=section)

                # Remove all reservation series, and set application round back to HANDLED
                # NOTE: This triggers _a lot_ of `post_delete` signals fo reservations.
                Reservation.objects.for_application_round(self.application_round).delete()
                ReservationSeries.objects.for_application_round(self.application_round).delete()

                self.application_round.handled_at = None
                self.application_round.save()

            case ApplicationRoundStatusChoice.RESULTS_SENT:
                # Reset handling email dates and round sent date
                Application.objects.filter(application_round=self.application_round).update(
                    results_ready_notification_sent_at=None,
                )

                self.application_round.sent_at = None
                self.application_round.save()

            case _:
                msg = f"Application round in status {self.application_round.status.value!r} cannot be reset"
                raise ApplicationRoundResetError(msg)

    def generate_reservations_from_allocations(self) -> None:
        allocations = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application__application_round=self.application_round.pk,
        ).select_related(
            "reservation_unit_option__reservation_unit__origin_hauki_resource",
            "reservation_unit_option__application_section__application__application_round",
        )

        closed_time_spans: dict[int, list[TimeSpanElement]] = self._get_series_override_closed_time_spans(allocations)

        reservation_series: list[ReservationSeries] = [
            ReservationSeries(
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

        reservation_pks: set[int] = set()

        with transaction.atomic():
            reservation_series = ReservationSeries.objects.bulk_create(reservation_series)

            for series in reservation_series:
                reservation_details = self._get_reservation_series_details(series)

                hauki_resource_id = getattr(series.reservation_unit.origin_hauki_resource, "id", None)
                slots = series.actions.pre_calculate_slots(
                    check_start_interval=True,
                    closed_hours=closed_time_spans.get(hauki_resource_id, []),
                )

                reservations = series.actions.bulk_create_reservation_for_periods(
                    periods=slots.possible,
                    reservation_details=reservation_details,
                )
                reservation_pks.update(reservation.pk for reservation in reservations)

                series.actions.bulk_create_rejected_occurrences_for_periods(
                    overlapping=slots.overlapping,
                    not_reservable=slots.not_reservable,
                    invalid_start_interval=slots.invalid_start_interval,
                )

        # Must refresh the materialized view after the reservation is created.
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(reservation_pks=list(reservation_pks))

    def _get_series_override_closed_time_spans(
        self, allocations: list[AllocatedTimeSlot]
    ) -> dict[int, list[TimeSpanElement]]:
        """
        Find all closed opening hours for all reservation units where allocations were made.
        Check against these and not fully normalized opening hours since allocations can be made
        outside opening hours (as this system defines them), but should not be on explicitly
        closed hours, like holidays.
        """
        closed_time_spans: dict[int, list[TimeSpanElement]] = {}
        for allocation in allocations:
            resource = allocation.reservation_unit_option.reservation_unit.origin_hauki_resource
            if resource is None or resource.id in closed_time_spans:
                continue  # Skip if already fetched

            application_round = allocation.reservation_unit_option.application_section.application.application_round

            # Fetch periods from Hauki API
            date_periods = HaukiAPIClient.get_date_periods(
                hauki_resource_id=resource.id,
                start_date_lte=application_round.reservation_period_end_date.isoformat(),  # Starts before period ends
                end_date_gte=application_round.reservation_period_begin_date.isoformat(),  # Ends after period begins
            )

            # Convert periods to TimeSpanElements
            closed_time_spans[resource.id] = [
                TimeSpanElement(
                    start_datetime=local_start_of_day(datetime.date.fromisoformat(period["start_date"])),
                    end_datetime=local_end_of_day(datetime.date.fromisoformat(period["end_date"])),
                    is_reservable=False,
                )
                for period in date_periods
                # Overriding closed date periods are exceptions to the normal opening hours
                if period["override"] and period["resource_state"] == HaukiResourceState.CLOSED.value
            ]

        return closed_time_spans

    def _get_reservation_series_details(self, series: ReservationSeries) -> ReservationDetails:
        application_section = series.allocated_time_slot.reservation_unit_option.application_section
        application = application_section.application

        reservee_type = ApplicantTypeChoice(application.applicant_type).customer_type_choice

        reservation_details = ReservationDetails(
            name=series.name,
            type=ReservationTypeChoice.SEASONAL,
            reservee_type=reservee_type,
            state=ReservationStateChoice.CONFIRMED,
            user=series.user,
            handled_at=application.application_round.handled_at,
            num_persons=application_section.num_persons,
            buffer_time_before=datetime.timedelta(0),
            buffer_time_after=datetime.timedelta(0),
            reservee_first_name=application.contact_person_first_name,
            reservee_last_name=application.contact_person_last_name,
            reservee_email=application.contact_person_email,
            reservee_phone=application.contact_person_phone_number,
            billing_address_street=application.billing_street_address,
            billing_address_city=application.billing_city,
            billing_address_zip=application.billing_post_code,
            purpose=application_section.purpose,
            municipality=application.municipality,
        )

        if reservee_type == CustomerTypeChoice.INDIVIDUAL:
            reservation_details["description"] = application.additional_information
            reservation_details["reservee_address_street"] = reservation_details["billing_address_street"]
            reservation_details["reservee_address_city"] = reservation_details["billing_address_city"]
            reservation_details["reservee_address_zip"] = reservation_details["billing_address_zip"]

        else:
            organisation_identifier = application.organisation_identifier

            reservation_details["description"] = application.organisation_core_business
            reservation_details["reservee_organisation_name"] = application.organisation_name
            reservation_details["reservee_id"] = organisation_identifier
            reservation_details["reservee_is_unregistered_association"] = not organisation_identifier
            reservation_details["reservee_address_street"] = application.organisation_street_address
            reservation_details["reservee_address_city"] = application.organisation_city
            reservation_details["reservee_address_zip"] = application.organisation_post_code

        return reservation_details
