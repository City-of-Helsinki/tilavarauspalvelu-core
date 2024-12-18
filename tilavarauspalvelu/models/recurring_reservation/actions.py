from __future__ import annotations

import dataclasses
import datetime
from itertools import chain
from typing import TYPE_CHECKING, Any, TypedDict

from tilavarauspalvelu.enums import RejectionReadinessChoice
from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.models import AffectingTimeSpan, RejectedOccurrence, Reservation
from utils.date_utils import DEFAULT_TIMEZONE, combine, get_periods_between

if TYPE_CHECKING:
    from collections.abc import Collection, Iterable

    from django.db import models

    from tilavarauspalvelu.enums import (
        CustomerTypeChoice,
        ReservationStateChoice,
        ReservationTypeChoice,
        ReservationTypeStaffChoice,
    )
    from tilavarauspalvelu.models import (
        AgeGroup,
        City,
        RecurringReservation,
        ReservableTimeSpan,
        ReservationPurpose,
        User,
    )


class ReservationPeriod(TypedDict):
    begin: datetime.datetime
    end: datetime.datetime


@dataclasses.dataclass
class ReservationSeriesCalculationResults:
    non_overlapping: list[ReservationPeriod] = dataclasses.field(default_factory=list)
    overlapping: list[ReservationPeriod] = dataclasses.field(default_factory=list)
    not_reservable: list[ReservationPeriod] = dataclasses.field(default_factory=list)
    invalid_start_interval: list[ReservationPeriod] = dataclasses.field(default_factory=list)

    def as_json(self, periods: list[ReservationPeriod]) -> list[dict[str, Any]]:
        return [
            {
                "begin": period["begin"].isoformat(timespec="seconds"),
                "end": period["end"].isoformat(timespec="seconds"),
            }
            for period in periods
        ]

    @property
    def overlapping_json(self) -> list[dict[str, Any]]:
        return self.as_json(self.overlapping)

    @property
    def not_reservable_json(self) -> list[dict[str, Any]]:
        return self.as_json(self.not_reservable)

    @property
    def invalid_start_interval_json(self) -> list[dict[str, Any]]:
        return self.as_json(self.invalid_start_interval)

    @property
    def possible(self) -> Iterable[ReservationPeriod]:
        return self.non_overlapping

    @property
    def not_possible(self) -> Iterable[ReservationPeriod]:
        return chain(self.overlapping, self.not_reservable, self.invalid_start_interval)


class ReservationDetails(TypedDict, total=False):
    name: str
    description: str
    num_persons: int
    state: ReservationStateChoice
    type: ReservationTypeChoice | ReservationTypeStaffChoice
    working_memo: str

    buffer_time_before: datetime.timedelta
    buffer_time_after: datetime.timedelta
    handled_at: datetime.datetime
    confirmed_at: datetime.datetime

    applying_for_free_of_charge: bool
    free_of_charge_reason: bool

    reservee_id: str
    reservee_first_name: str
    reservee_last_name: str
    reservee_email: str
    reservee_phone: str
    reservee_organisation_name: str
    reservee_address_street: str
    reservee_address_city: str
    reservee_address_zip: str
    reservee_is_unregistered_association: bool
    reservee_language: str
    reservee_type: CustomerTypeChoice

    billing_first_name: str
    billing_last_name: str
    billing_email: str
    billing_phone: str
    billing_address_street: str
    billing_address_city: str
    billing_address_zip: str

    user: int | User
    purpose: int | ReservationPurpose
    home_city: int | City
    age_group: int | AgeGroup


class RecurringReservationActions:
    def __init__(self, recurring_reservation: RecurringReservation) -> None:
        self.recurring_reservation = recurring_reservation

    def pre_calculate_slots(
        self,
        *,
        check_opening_hours: bool = False,
        check_buffers: bool = False,
        check_start_interval: bool = False,
        skip_dates: Collection[datetime.date] = (),
        closed_hours: Collection[TimeSpanElement] = (),
        buffer_time_before: datetime.timedelta | None = None,
        buffer_time_after: datetime.timedelta | None = None,
        ignore_reservations: Collection[int] = (),
    ) -> ReservationSeriesCalculationResults:
        """
        Pre-calculate slots for reservations for the recurring reservation.

        :param check_opening_hours: Whether to check if the reservation falls within reservable times.
        :param check_buffers: Whether to check if the reservation overlaps with other reservations' buffers.
        :param check_start_interval: Whether to check if the reservation starts at the correct interval.
        :param skip_dates: Dates to skip when calculating slots.
        :param closed_hours: Explicitly closed opening hours for the resource.
        :param buffer_time_before: Used buffer time before the reservation.
        :param buffer_time_after: Used buffer time after the reservation.
        :param ignore_reservations: Reservations to ignore when calculating slots, e.g., for rescheduling.
        """
        affecting_timespans = AffectingTimeSpan.objects.filter(
            affected_reservation_unit_ids__contains=[self.recurring_reservation.reservation_unit.pk],
            buffered_start_datetime__date__lte=self.recurring_reservation.end_date,
            buffered_end_datetime__date__gte=self.recurring_reservation.begin_date,
        )
        if ignore_reservations:
            affecting_timespans = affecting_timespans.exclude(reservation__in=ignore_reservations)

        timespans = [timespan.as_time_span_element() for timespan in affecting_timespans]

        reservable_timespans = self.get_reservable_timespans() if check_opening_hours else []

        results = ReservationSeriesCalculationResults()

        begin_time: datetime.time = self.recurring_reservation.begin_time
        end_time: datetime.time = self.recurring_reservation.end_time
        reservation_unit = self.recurring_reservation.reservation_unit

        weekdays: list[int] = [int(val) for val in self.recurring_reservation.weekdays.split(",") if val]
        if not weekdays:
            weekdays = [self.recurring_reservation.begin_date.weekday()]

        for weekday in weekdays:
            delta: int = weekday - self.recurring_reservation.begin_date.weekday()
            if delta < 0:
                delta += 7

            begin_date: datetime.date = self.recurring_reservation.begin_date + datetime.timedelta(days=delta)

            periods = get_periods_between(
                start_date=begin_date,
                end_date=self.recurring_reservation.end_date,
                start_time=begin_time,
                end_time=end_time,
                interval=self.recurring_reservation.recurrence_in_days,
                tzinfo=DEFAULT_TIMEZONE,
            )
            for begin, end in periods:
                if begin.date() in skip_dates:
                    continue

                reservation_timespan = TimeSpanElement(
                    start_datetime=begin,
                    end_datetime=end,
                    is_reservable=True,
                    buffer_time_before=(
                        reservation_unit.actions.get_actual_before_buffer(begin, buffer_time_before)
                        if check_buffers
                        else None
                    ),
                    buffer_time_after=(
                        reservation_unit.actions.get_actual_after_buffer(end, buffer_time_after)
                        if check_buffers
                        else None
                    ),
                )

                # Would the reservation timespan overlap with any closing timespans
                # that exist due to existing reservations? Checks for:
                # 1) Unbuffered reservation timespan overlapping with any buffered closed timespan
                # 2) Unbuffered closed timespan overlapping with any buffered reservation timespan
                # Note that reservation timespans buffers are only checked if `check_buffers=True`.
                if any(
                    reservation_timespan.overlaps_with(timespan) or timespan.overlaps_with(reservation_timespan)
                    for timespan in timespans
                ):
                    results.overlapping.append(ReservationPeriod(begin=begin, end=end))
                    continue

                # Would the reservation be fully inside any reservable timespans for the resource?
                # Ignore buffers for the reservation, since those can be outside reservable times.
                if check_opening_hours and not any(
                    reservation_timespan.fully_inside_of(reservable) for reservable in reservable_timespans
                ):
                    results.not_reservable.append(ReservationPeriod(begin=begin, end=end))
                    continue

                # Would the reservation overlap with any explicitly closed opening hours for the resource?
                if closed_hours and any(
                    reservation_timespan.overlaps_with(closed_time_span) for closed_time_span in closed_hours
                ):
                    results.not_reservable.append(ReservationPeriod(begin=begin, end=end))
                    continue

                if check_start_interval and not reservation_unit.actions.is_valid_staff_start_interval(begin.timetz()):
                    results.invalid_start_interval.append(ReservationPeriod(begin=begin, end=end))
                    continue

                results.non_overlapping.append(ReservationPeriod(begin=begin, end=end))

        return results

    def get_reservable_timespans(self) -> list[TimeSpanElement]:
        begin_time = self.recurring_reservation.begin_time
        end_time = self.recurring_reservation.end_time
        hauki_resource = self.recurring_reservation.reservation_unit.origin_hauki_resource
        if hauki_resource is None:
            return []

        timespans: Iterable[ReservableTimeSpan] = hauki_resource.reservable_time_spans.all().overlapping_with_period(
            start=combine(self.recurring_reservation.begin_date, begin_time, tzinfo=DEFAULT_TIMEZONE),
            end=combine(self.recurring_reservation.end_date, end_time, tzinfo=DEFAULT_TIMEZONE),
        )

        return [timespan.as_time_span_element() for timespan in timespans]

    def bulk_create_reservation_for_periods(
        self,
        periods: Iterable[ReservationPeriod],
        reservation_details: ReservationDetails,
    ) -> list[Reservation]:
        # Pick out the through model for the many-to-many relationship and use if for bulk creation
        ThroughModel: type[models.Model] = Reservation.reservation_units.through  # noqa: N806

        reservations: list[Reservation] = []
        through_models: list[models.Model] = []

        for period in periods:
            if self.recurring_reservation.reservation_unit.reservation_block_whole_day:
                reservation_details.setdefault(
                    "buffer_time_before",
                    self.recurring_reservation.reservation_unit.actions.get_actual_before_buffer(period["begin"]),
                )
                reservation_details.setdefault(
                    "buffer_time_after",
                    self.recurring_reservation.reservation_unit.actions.get_actual_after_buffer(period["end"]),
                )

            reservation = Reservation(
                begin=period["begin"],
                end=period["end"],
                recurring_reservation=self.recurring_reservation,
                age_group=self.recurring_reservation.age_group,
                **reservation_details,
            )
            through = ThroughModel(
                reservation=reservation,
                reservationunit=self.recurring_reservation.reservation_unit,
            )
            reservations.append(reservation)
            through_models.append(through)

        reservations = Reservation.objects.bulk_create(reservations)
        ThroughModel.objects.bulk_create(through_models)
        return reservations

    def bulk_create_rejected_occurrences_for_periods(
        self,
        overlapping: Iterable[ReservationPeriod],
        not_reservable: Iterable[ReservationPeriod],
        invalid_start_interval: Iterable[ReservationPeriod],
    ) -> list[RejectedOccurrence]:
        occurrences: list[RejectedOccurrence] = (
            [
                RejectedOccurrence(
                    begin_datetime=period["begin"],
                    end_datetime=period["end"],
                    rejection_reason=RejectionReadinessChoice.OVERLAPPING_RESERVATIONS,
                    recurring_reservation=self.recurring_reservation,
                )
                for period in overlapping
            ]
            + [
                RejectedOccurrence(
                    begin_datetime=period["begin"],
                    end_datetime=period["end"],
                    rejection_reason=RejectionReadinessChoice.RESERVATION_UNIT_CLOSED,
                    recurring_reservation=self.recurring_reservation,
                )
                for period in not_reservable
            ]
            + [
                RejectedOccurrence(
                    begin_datetime=period["begin"],
                    end_datetime=period["end"],
                    rejection_reason=RejectionReadinessChoice.INTERVAL_NOT_ALLOWED,
                    recurring_reservation=self.recurring_reservation,
                )
                for period in invalid_start_interval
            ]
        )

        return RejectedOccurrence.objects.bulk_create(occurrences)

    def get_email_reservee_name(self) -> str:
        reservation: Reservation | None = self.recurring_reservation.reservations.last()

        if reservation is not None:
            return reservation.actions.get_email_reservee_name()
        return ""
