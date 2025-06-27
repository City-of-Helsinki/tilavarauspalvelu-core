from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING, Literal

from lookup_property import L

from tilavarauspalvelu.dataclasses import ReservationSeriesCalculationResults
from tilavarauspalvelu.enums import AccessType, RejectionReadinessChoice, Weekday
from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.models import AffectingTimeSpan, ApplicationSection, RejectedOccurrence, Reservation
from tilavarauspalvelu.typing import ReservationPeriod
from utils.date_utils import DEFAULT_TIMEZONE, combine, get_periods_between, local_datetime

if TYPE_CHECKING:
    from collections.abc import Collection, Iterable

    from tilavarauspalvelu.models import ReservableTimeSpan, ReservationSeries
    from tilavarauspalvelu.typing import ReservationDetails


__all__ = [
    "ReservationSeriesActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationSeriesActions:
    reservation_series: ReservationSeries

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
        Pre-calculate slots for reservations for the reservation series.

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
            affected_reservation_unit_ids__contains=[self.reservation_series.reservation_unit.pk],
            buffered_start_datetime__date__lte=self.reservation_series.end_date,
            buffered_end_datetime__date__gte=self.reservation_series.begin_date,
        )
        if ignore_reservations:
            affecting_timespans = affecting_timespans.exclude(reservation__in=ignore_reservations)

        timespans = [timespan.as_time_span_element() for timespan in affecting_timespans]

        reservable_timespans = self.get_reservable_timespans() if check_opening_hours else []

        results = ReservationSeriesCalculationResults()

        begin_time: datetime.time = self.reservation_series.begin_time
        end_time: datetime.time = self.reservation_series.end_time
        reservation_unit = self.reservation_series.reservation_unit

        weekdays: list[Weekday] = [Weekday(weekday) for weekday in self.reservation_series.weekdays]
        if not weekdays:
            weekday_num: Literal[0, 1, 2, 3, 4, 5, 6] = self.reservation_series.begin_date.weekday()  # type: ignore[assignment]
            weekdays = [Weekday.from_week_day(weekday_num)]

        for weekday in weekdays:
            delta: int = weekday.as_weekday_number - self.reservation_series.begin_date.weekday()
            if delta < 0:
                delta += 7

            begin_date: datetime.date = self.reservation_series.begin_date + datetime.timedelta(days=delta)

            periods = get_periods_between(
                start_date=begin_date,
                end_date=self.reservation_series.end_date,
                start_time=begin_time,
                end_time=end_time,
                interval=self.reservation_series.recurrence_in_days,
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
        begin_time = self.reservation_series.begin_time
        end_time = self.reservation_series.end_time
        hauki_resource = self.reservation_series.reservation_unit.origin_hauki_resource
        if hauki_resource is None:
            return []

        timespans: Iterable[ReservableTimeSpan] = hauki_resource.reservable_time_spans.all().overlapping_with_period(
            start=combine(self.reservation_series.begin_date, begin_time, tzinfo=DEFAULT_TIMEZONE),
            end=combine(self.reservation_series.end_date, end_time, tzinfo=DEFAULT_TIMEZONE),
        )

        return [timespan.as_time_span_element() for timespan in timespans]

    def bulk_create_reservation_for_periods(
        self,
        periods: Iterable[ReservationPeriod],
        reservation_details: ReservationDetails,
    ) -> list[Reservation]:
        if not periods:
            return []

        reservation_unit = self.reservation_series.reservation_unit

        begin_date = min(period["begin"].date() for period in periods)
        end_date = max(period["begin"].date() for period in periods)
        access_type_map = reservation_unit.actions.get_access_types_on_period(begin_date, end_date)

        reservations: list[Reservation] = []

        for period in periods:
            if reservation_unit.reservation_block_whole_day:
                reservation_details.setdefault(
                    "buffer_time_before",
                    reservation_unit.actions.get_actual_before_buffer(period["begin"]),
                )
                reservation_details.setdefault(
                    "buffer_time_after",
                    reservation_unit.actions.get_actual_after_buffer(period["end"]),
                )

            access_type = access_type_map.get(period["begin"].date(), AccessType.UNRESTRICTED)

            reservation = Reservation(
                begins_at=period["begin"],
                ends_at=period["end"],
                reservation_series=self.reservation_series,
                age_group=self.reservation_series.age_group,
                access_type=access_type,
                reservation_unit=reservation_unit,
                **reservation_details,
            )
            reservations.append(reservation)

        return Reservation.objects.bulk_create(reservations)

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
                    reservation_series=self.reservation_series,
                )
                for period in overlapping
            ]
            + [
                RejectedOccurrence(
                    begin_datetime=period["begin"],
                    end_datetime=period["end"],
                    rejection_reason=RejectionReadinessChoice.RESERVATION_UNIT_CLOSED,
                    reservation_series=self.reservation_series,
                )
                for period in not_reservable
            ]
            + [
                RejectedOccurrence(
                    begin_datetime=period["begin"],
                    end_datetime=period["end"],
                    rejection_reason=RejectionReadinessChoice.INTERVAL_NOT_ALLOWED,
                    reservation_series=self.reservation_series,
                )
                for period in invalid_start_interval
            ]
        )

        return RejectedOccurrence.objects.bulk_create(occurrences)

    def get_email_reservee_name(self) -> str:
        reservation: Reservation | None = self.reservation_series.reservations.last()

        if reservation is not None:
            return reservation.actions.get_email_reservee_name()
        return ""

    def get_application_section(self) -> ApplicationSection | None:
        return ApplicationSection.objects.filter(
            reservation_unit_options__allocated_time_slots__reservation_series=self.reservation_series
        ).first()

    def has_inactive_access_codes_which_should_be_active(self) -> bool:
        return self.reservation_series.reservations.filter(
            L(access_code_should_be_active=True),
            access_code_is_active=False,
            ends_at__gt=local_datetime(),
        ).exists()

    def has_upcoming_or_ongoing_reservations_with_active_access_codes(self) -> bool:
        return self.reservation_series.reservations.filter(
            access_code_is_active=True,
            ends_at__gt=local_datetime(),
        ).exists()
