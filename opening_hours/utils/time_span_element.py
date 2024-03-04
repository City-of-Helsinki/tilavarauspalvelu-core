import datetime
import zoneinfo
from dataclasses import dataclass, field
from math import ceil
from typing import TYPE_CHECKING, Optional

from common.date_utils import DEFAULT_TIMEZONE, combine, local_start_of_day, time_as_timedelta
from opening_hours.enums import HaukiResourceState
from opening_hours.utils.hauki_api_types import HaukiAPIOpeningHoursResponseTime
from reservation_units.enums import ReservationStartInterval

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit


@dataclass(order=True, frozen=False)
class TimeSpanElement:
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime
    is_reservable: bool
    buffer_time_after: datetime.timedelta = field(default_factory=datetime.timedelta)
    buffer_time_before: datetime.timedelta = field(default_factory=datetime.timedelta)

    def __repr__(self) -> str:
        reservable_str = "Reservable" if self.is_reservable else "Closed"
        return f"<{self.__class__.__name__}({self._get_datetime_str()}, {reservable_str})>"

    def _get_datetime_str(self) -> str:
        strformat = "%Y-%m-%d %H:%M"

        start = self.start_datetime.astimezone(DEFAULT_TIMEZONE)
        end = self.end_datetime.astimezone(DEFAULT_TIMEZONE)

        start_date = start.date()
        end_date = end.date()

        start_str = "min" if start_date == datetime.date.min else start.strftime(strformat)

        if end_date == datetime.date.max:
            end_str = "max"
        elif end_date == start_date:
            end_str = end.strftime("%H:%M")
        elif end_date == start_date + datetime.timedelta(days=1) and end_date == datetime.time.min:
            end_str = "24:00"
        else:
            end_str = end.strftime(strformat)

        duration_str = f"{start_str}-{end_str}"

        if self.buffer_time_before:
            duration_str += f", -{str(self.buffer_time_before).zfill(8)[:5]}"
        if self.buffer_time_after:
            duration_str += f", +{str(self.buffer_time_after).zfill(8)[:5]}"

        return duration_str

    def __copy__(self) -> "TimeSpanElement":
        return TimeSpanElement(
            start_datetime=self.start_datetime,
            end_datetime=self.end_datetime,
            is_reservable=self.is_reservable,
            buffer_time_after=self.buffer_time_after,
            buffer_time_before=self.buffer_time_before,
        )

    def __hash__(self) -> int:
        return hash(
            (
                self.start_datetime,
                self.end_datetime,
                self.is_reservable,
                self.buffer_time_after,
                self.buffer_time_before,
            )
        )

    @classmethod
    def create_from_time_element(
        cls,
        date: datetime.date,
        timezone: zoneinfo.ZoneInfo,
        time_element: HaukiAPIOpeningHoursResponseTime,
    ) -> Optional["TimeSpanElement"]:
        # We only care if the resource is reservable or closed on the time frame.
        # That means we can ignore all other states (OPEN, SELF_SERVICE, WEATHER_PERMITTING, etc.)
        time_element_state = HaukiResourceState.get(time_element["resource_state"])
        if not time_element_state.is_reservable and not time_element_state.is_closed:
            return None

        full_day: bool = time_element["full_day"] or (
            time_element["start_time"] is None and time_element["end_time"] is None
        )

        start_time: datetime.time = (
            datetime.time()
            if full_day or time_element["start_time"] is None
            else datetime.datetime.strptime(time_element["start_time"], "%H:%M:%S").time()
        )

        start_datetime = combine(date, start_time, tzinfo=timezone)

        if time_element["end_time_on_next_day"] or full_day:
            date += datetime.timedelta(days=1)

        end_time: datetime.time = (
            datetime.time()
            if full_day or time_element["end_time"] is None
            else datetime.datetime.strptime(time_element["end_time"], "%H:%M:%S").time()
        )

        end_datetime = combine(date, end_time, tzinfo=timezone)

        # If the time span duration would be zero or negative, return None.
        if start_datetime >= end_datetime:
            return None

        return TimeSpanElement(
            start_datetime=start_datetime.astimezone(DEFAULT_TIMEZONE),
            end_datetime=end_datetime.astimezone(DEFAULT_TIMEZONE),
            is_reservable=time_element_state.is_reservable,
        )

    @property
    def buffered_start_datetime(self) -> datetime.datetime:
        """Start time of the time span, including buffer time  before the start."""
        if not self.buffer_time_before:
            return self.start_datetime
        return self.start_datetime - self.buffer_time_before

    @property
    def buffered_end_datetime(self) -> datetime.datetime:
        """End time of the time span, including buffer time after the end."""
        if not self.buffer_time_after:
            return self.end_datetime
        return self.end_datetime + self.buffer_time_after

    @property
    def duration_minutes(self) -> float:
        """Duration of the time span, NOT including buffer times."""
        return (self.end_datetime - self.start_datetime).total_seconds() / 60

    @property
    def buffered_duration_minutes(self) -> float:
        """Duration of the time span, including buffer times."""
        return (self.buffered_end_datetime - self.buffered_start_datetime).total_seconds() / 60

    @property
    def front_buffered_duration_minutes(self) -> float:
        """Duration of the time span, including only buffer time before the start."""
        if not self.buffer_time_before:
            return self.duration_minutes
        return self.duration_minutes + (self.buffer_time_before.total_seconds() / 60)

    @property
    def back_buffered_duration_minutes(self) -> float:
        """Duration of the time span, including only buffer times after the end."""
        if not self.buffer_time_after:
            return self.duration_minutes
        return self.duration_minutes + (self.buffer_time_after.total_seconds() / 60)

    def overlaps_with(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans overlap with the other time span?

                Other
             ┌─ Timespan ─┐
        ═══  │            │      # No
        ═════│            │      # No
        ═════│══          │      # Yes
        ═════│════════════│      # Yes
             │            │
             │  ════════  │      # Yes
             │════════════│      # Yes
        ═════│════════════│═════ # Yes
             │            │
             │════════════│═════ # Yes
             │          ══│═════ # Yes
             │            │═════ # No
             │            │  ═══ # No
        """
        return self.start_datetime < other.buffered_end_datetime and self.end_datetime > other.buffered_start_datetime

    def fully_inside_of(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans fully overlap with the other time span?

                Other
             ┌─ Timespan ─┐
        ═══  │            │      # No
        ═════│            │      # No
        ═════│══          │      # No
        ═════│════════════│      # No
             │            │
             │  ════════  │      # Yes
             │════════════│      # Yes
        ═════│════════════│═════ # No
             │            │
             │════════════│═════ # No
             │          ══│═════ # No
             │            │═════ # No
             │            │  ═══ # No
        """
        return self.start_datetime >= other.buffered_start_datetime and self.end_datetime <= other.buffered_end_datetime

    def starts_inside_of(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans start inside the other time span?

                Other
             ┌─ Timespan ─┐
        ═══  │            │      # No
        ═════│            │      # No
        ═════│══          │      # No
        ═════│════════════│      # No
             │            │
             │  ════════  │      # Yes
             │════════════│      # Yes
        ═════│════════════│═════ # No
             │            │
             │════════════│═════ # Yes
             │          ══│═════ # Yes
             │            │═════ # No
             │            │  ═══ # No
        """
        return other.buffered_start_datetime <= self.start_datetime < other.buffered_end_datetime

    def ends_inside_of(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans end inside the other time span?

                Other
             ┌─ Timespan ─┐
        ═══  │            │      # No
        ═════│            │      # No
        ═════│══          │      # Yes
        ═════│════════════│      # Yes
             │            │
             │  ════════  │      # Yes
             │════════════│      # Yes
        ═════│════════════│═════ # No
             │            │
             │════════════│═════ # No
             │          ══│═════ # No
             │            │═════ # No
             │            │  ═══ # No
        """
        return other.buffered_start_datetime < self.end_datetime <= other.buffered_end_datetime

    def can_fit_reservation_for_reservation_unit(
        self,
        reservation_unit: "ReservationUnit",
        minimum_duration_minutes: int,
    ) -> bool:
        """Can a reservation from given ReservationUnit fit inside this TimeSpanElement?"""
        if reservation_unit.min_reservation_duration:
            minimum_duration_minutes = max(
                reservation_unit.min_reservation_duration.total_seconds() / 60,
                minimum_duration_minutes,
            )

        # If this time span's duration is less than the minimum duration, it obviously can't fit.
        if self.duration_minutes < minimum_duration_minutes:
            return False

        # Validate duration with front buffers
        buffer_front_minutes = 0
        if reservation_unit.buffer_time_before:
            buffer_front_minutes = reservation_unit.buffer_time_before.total_seconds() / 60
            if self.front_buffered_duration_minutes < (buffer_front_minutes + minimum_duration_minutes):
                return False

        # Validate duration with back buffers
        buffer_back_minutes = 0
        if reservation_unit.buffer_time_after:
            buffer_back_minutes = reservation_unit.buffer_time_after.total_seconds() / 60
            if self.back_buffered_duration_minutes < (minimum_duration_minutes + buffer_back_minutes):
                return False

        # Validate duration with front and back buffers
        # We need to validate front, back and total duration separately because the buffers
        # can be different lengths in the front and back.
        if self.buffered_duration_minutes < (buffer_front_minutes + minimum_duration_minutes + buffer_back_minutes):
            return False

        return True

    def move_to_next_valid_start_time(self, reservation_unit: "ReservationUnit") -> None:
        """
        Move reservable time span start time to the next valid start time based on the
        given reservation unit's settings and filter time start.

        For a reservation to be valid, its start time must be at an interval that is valid for the ReservationUnit.
        e.g. When ReservationUnit.reservation_start_interval is 30 minutes,
        a reservation must start at 00:00, 00:30, 01:00, 01:30 from the start of the time span.

        FIXME: This function only works when the interval is <= 60 minutes.
         When the interval is > 60 minutes, the function MAY not always work as intended.
        """
        # If a buffer was added to the reservable time span, but the reservation units buffer is longer,
        # we need to move the start time forward to account for the difference.
        if self.buffer_time_before < reservation_unit.buffer_time_before:
            self.start_datetime += reservation_unit.buffer_time_before - self.buffer_time_before
            self.buffer_time_before = reservation_unit.buffer_time_before

        interval: int = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        # Round the start time to the next valid minute, if the start time contains seconds or microseconds.
        if self.start_datetime.microsecond > 0 or self.start_datetime.second > 0:
            self.start_datetime = self.start_datetime.replace(second=0, microsecond=0) + datetime.timedelta(minutes=1)

        # Convert the start time to minutes. e.g. time(10, 15) -> 615, time(14, 30) -> 870
        timedelta_minutes = time_as_timedelta(self.start_datetime).total_seconds() / 60
        # Number of minutes past the last valid interval. e.g. interval=30, 615 % 30 = 15, 870 % 30 = 0
        overflow_minutes = ceil(timedelta_minutes % interval)
        if overflow_minutes == 0:
            return

        # Move the start time to the next valid interval by adding the difference between interval and overflow minutes
        # to the start time. e.g. interval=30, overflow_minutes=15, 30 - 15 = 15, start_time += 15 minutes
        delta_to_next_interval = datetime.timedelta(minutes=interval - overflow_minutes)
        self.start_datetime += delta_to_next_interval

    def generate_closed_time_spans_outside_filter(
        self,
        filter_time_start: datetime.time | None,
        filter_time_end: datetime.time | None,
    ) -> list["TimeSpanElement"]:
        """
        Generate a list of closed time spans for this time span based on given filter time values.

        This function creates closed time spans for the periods outside the specified filter range.
        The resulting list may contain at most two time spans for every day between the start and end date
        of the original time span, representing the time ranges before and after the specified filter.

        Example:
        >>> time_span = TimeSpanElement(
        ...     start_datetime=datetime.datetime(2024, 1, 1, 10, 0),
        ...     end_datetime=datetime.datetime(2024, 1, 2, 10, 0),
        ...     is_reservable=True,
        ... )
        >>> time_span.generate_closed_time_spans_outside_filter(
        ...     filter_time_start=datetime.time(10, 0),
        ...     filter_time_end=datetime.time(14, 0),
        ... )
        [
            <TimeSpanElement(2024-01-01 00:00-10:00, Closed)>,
            <TimeSpanElement(2024-01-01 14:00-00:00, Closed)>,
            <TimeSpanElement(2024-01-02 00:00-10:00, Closed)>,
            <TimeSpanElement(2024-01-02 14:00-00:00, Closed)>,
        ]
        """
        closed_time_spans: list[TimeSpanElement] = []

        if not filter_time_start and not filter_time_end:
            return closed_time_spans

        if filter_time_start and filter_time_start.tzinfo is not None:
            raise ValueError("`filter_time_start` must be timezone naive.")
        if filter_time_end and filter_time_end.tzinfo is not None:
            raise ValueError("`filter_time_end` must be timezone naive.")

        # Loop through every day between the start and end date of this time span
        for day in self.get_dates_range():
            # Add closed time spans for the time range outside the given filter range
            # e.g. Filter time range is 10:00-14:00, add closed time spans for 00:00-10:00 and 14:00-00:00
            if filter_time_start and filter_time_start != datetime.datetime.min:
                closed_time_spans.append(
                    TimeSpanElement(
                        start_datetime=local_start_of_day(day),
                        end_datetime=combine(day, filter_time_start, tzinfo=DEFAULT_TIMEZONE),
                        is_reservable=False,
                    )
                )
            if filter_time_end and filter_time_end != datetime.datetime.min:
                closed_time_spans.append(
                    TimeSpanElement(
                        start_datetime=combine(day, filter_time_end, tzinfo=DEFAULT_TIMEZONE),
                        end_datetime=local_start_of_day(day) + datetime.timedelta(days=1),
                        is_reservable=False,
                    )
                )

        return closed_time_spans

    def get_dates_range(self) -> list[datetime.date]:
        """
        Return a list of dates that are covered by this time span.

        >>> time_span = TimeSpanElement(
        ...     start_datetime=datetime.datetime(2021, 1, 1, 10, 0),
        ...     end_datetime=datetime.datetime(2021, 1, 3, 10, 0),
        ...     is_reservable=True,
        ... )
        >>> time_span.get_dates_range()
        [datetime.date(2021, 1, 1), datetime.date(2021, 1, 2), datetime.date(2021, 1, 3)]
        """
        return [
            self.buffered_start_datetime.date() + datetime.timedelta(i)
            for i in range(int((self.buffered_end_datetime.date() - self.buffered_start_datetime.date()).days) + 1)
        ]
