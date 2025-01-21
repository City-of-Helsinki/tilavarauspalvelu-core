from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import HaukiResourceState
from tilavarauspalvelu.exceptions import TimeSpanElementError
from utils.date_utils import DEFAULT_TIMEZONE, combine, datetime_range_as_string, local_start_of_day

if TYPE_CHECKING:
    import zoneinfo

    from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIOpeningHoursResponseTime


@dataclass(order=True, frozen=False)
class TimeSpanElement:
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime
    is_reservable: bool
    buffer_time_after: datetime.timedelta = field(default_factory=datetime.timedelta)
    buffer_time_before: datetime.timedelta = field(default_factory=datetime.timedelta)

    def __repr__(self) -> str:
        reservable_str = "Reservable" if self.is_reservable else "Closed"
        duration_str = datetime_range_as_string(start_datetime=self.start_datetime, end_datetime=self.end_datetime)

        if self.buffer_time_before:
            duration_str += f", -{str(self.buffer_time_before).zfill(8)[:5]}"
        if self.buffer_time_after:
            duration_str += f", +{str(self.buffer_time_after).zfill(8)[:5]}"

        return f"<{self.__class__.__name__}({duration_str}, {reservable_str})>"

    def __copy__(self) -> TimeSpanElement:
        return TimeSpanElement(
            start_datetime=self.start_datetime,
            end_datetime=self.end_datetime,
            is_reservable=self.is_reservable,
            buffer_time_after=self.buffer_time_after,
            buffer_time_before=self.buffer_time_before,
        )

    def __hash__(self) -> int:
        return hash((
            self.start_datetime,
            self.end_datetime,
            self.is_reservable,
            self.buffer_time_after,
            self.buffer_time_before,
        ))

    @classmethod
    def create_from_time_element(
        cls,
        date: datetime.date,
        timezone: zoneinfo.ZoneInfo,
        time_element: HaukiAPIOpeningHoursResponseTime,
    ) -> TimeSpanElement | None:
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

    def round_start_time_to_next_minute(self) -> None:
        """Round the start time to the next valid minute, if the start time contains seconds or microseconds."""
        if self.start_datetime.microsecond > 0 or self.start_datetime.second > 0:
            self.start_datetime = self.start_datetime.replace(second=0, microsecond=0) + datetime.timedelta(minutes=1)

    def overlaps_with(self, other: TimeSpanElement) -> bool:
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

    def fully_inside_of(self, other: TimeSpanElement) -> bool:
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

    def starts_inside_of(self, other: TimeSpanElement) -> bool:
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

    def ends_inside_of(self, other: TimeSpanElement) -> bool:
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

    def generate_closed_time_spans_outside_filter(
        self,
        filter_time_start: datetime.time | None,
        filter_time_end: datetime.time | None,
    ) -> list[TimeSpanElement]:
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
            msg = "`filter_time_start` must be timezone naive."
            raise TimeSpanElementError(msg)
        if filter_time_end and filter_time_end.tzinfo is not None:
            msg = "`filter_time_end` must be timezone naive."
            raise TimeSpanElementError(msg)

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
