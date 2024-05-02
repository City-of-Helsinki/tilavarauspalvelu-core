from __future__ import annotations

import dataclasses
import datetime
from collections.abc import Collection, Iterable
from typing import Any

from django.db import models

from common.date_utils import (
    DEFAULT_TIMEZONE,
    ReservationPeriod,
    combine,
    get_periods_between,
    merge_periods_into_time_span_elements,
)
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.time_span_element import TimeSpanElement
from reservations.models import RecurringReservation, Reservation


@dataclasses.dataclass
class ReservationSeriesCalculationResults:
    non_overlapping: list[ReservationPeriod] = dataclasses.field(default_factory=list)
    overlapping: list[ReservationPeriod] = dataclasses.field(default_factory=list)
    not_reservable: list[ReservationPeriod] = dataclasses.field(default_factory=list)

    @property
    def overlapping_json(self):
        return [
            {
                "begin": period["begin"].isoformat(timespec="seconds"),
                "end": period["end"].isoformat(timespec="seconds"),
            }
            for period in self.overlapping
        ]

    @property
    def not_reservable_json(self):
        return [
            {
                "begin": period["begin"].isoformat(timespec="seconds"),
                "end": period["end"].isoformat(timespec="seconds"),
            }
            for period in self.not_reservable
        ]


class RecurringReservationActions:
    def __init__(self, recurring_reservation: RecurringReservation):
        self.recurring_reservation = recurring_reservation

    def pre_calculate_slots(
        self,
        *,
        check_opening_hours: bool = False,
        skip_dates: Collection[datetime.date] = (),
    ) -> ReservationSeriesCalculationResults:
        """Pre-calculate slots in the recurring reservation."""
        periods = (
            Reservation.objects.overlapping_period(
                period_start=self.recurring_reservation.begin_date,
                period_end=self.recurring_reservation.end_date,
            )
            .affecting_reservations(
                reservation_units=[self.recurring_reservation.reservation_unit.pk],
            )
            .values("begin", "end")
            .order_by("begin")
        )

        reserved_timespans = merge_periods_into_time_span_elements(periods)
        reservable_timespans = self.get_reservable_timespans() if check_opening_hours else []

        results = ReservationSeriesCalculationResults()

        begin_time: datetime.time = self.recurring_reservation.begin_time  # type: ignore[assignment]
        end_time: datetime.time = self.recurring_reservation.end_time  # type: ignore[assignment]

        weekdays: list[int] = [int(val) for val in self.recurring_reservation.weekdays.split(",")]
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

                timespan = TimeSpanElement(
                    start_datetime=begin,
                    end_datetime=end,
                    is_reservable=True,
                    buffer_time_after=self.recurring_reservation.reservation_unit.buffer_time_after,
                    buffer_time_before=self.recurring_reservation.reservation_unit.buffer_time_before,
                )

                # Would the reservation overlap with any existing reservations?
                # Also checks that buffers for the reservation will also not overlap.
                if any(timespan.overlaps_with(reserved) for reserved in reserved_timespans):
                    results.overlapping.append(ReservationPeriod(begin=begin, end=end))
                    continue

                # Would the reservation be fully inside any reservable timespans for the resource?
                # Ignores buffers for the reservation, since those can be outside reservable times.
                if check_opening_hours and not any(
                    timespan.fully_inside_of(reservable) for reservable in reservable_timespans
                ):
                    results.not_reservable.append(ReservationPeriod(begin=begin, end=end))
                    continue

                results.non_overlapping.append(ReservationPeriod(begin=begin, end=end))

        return results

    def get_reservable_timespans(self) -> list[TimeSpanElement]:
        begin_time = self.recurring_reservation.begin_time
        end_time = self.recurring_reservation.end_time
        resource = self.recurring_reservation.reservation_unit.origin_hauki_resource
        if resource is None:
            return []

        timespans: Iterable[ReservableTimeSpan] = resource.reservable_time_spans.all().overlapping_with_period(
            start=combine(self.recurring_reservation.begin_date, begin_time, tzinfo=DEFAULT_TIMEZONE),
            end=combine(self.recurring_reservation.end_date, end_time, tzinfo=DEFAULT_TIMEZONE),
        )

        return [timespan.as_time_span_element() for timespan in timespans]

    def bulk_create_reservation_for_periods(
        self,
        periods: list[ReservationPeriod],
        reservation_details: dict[str, Any],
    ) -> list[Reservation]:
        # Pick out the through model for the many-to-many relationship and use if for bulk creation
        ThroughModel: type[models.Model] = Reservation.reservation_unit.through  # noqa: N806

        reservations: list[Reservation] = []
        through_models: list[models.Model] = []

        for period in periods:
            if self.recurring_reservation.reservation_unit.reservation_block_whole_day:
                reservation_details["buffer_time_before"] = (
                    self.recurring_reservation.reservation_unit.actions.get_actual_before_buffer(period["begin"])
                )
                reservation_details["buffer_time_after"] = (
                    self.recurring_reservation.reservation_unit.actions.get_actual_after_buffer(period["end"])
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
