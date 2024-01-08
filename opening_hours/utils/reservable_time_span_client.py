import calendar
import datetime
import zoneinfo
from copy import copy
from dataclasses import dataclass
from math import ceil
from typing import TYPE_CHECKING, Optional

from django.conf import settings

from common.date_utils import (
    DEFAULT_TIMEZONE,
    combine,
    local_date,
    local_start_of_day,
    time_as_timedelta,
)
from common.utils import with_indices
from opening_hours.enums import HaukiResourceState
from opening_hours.errors import (
    ReservableTimeSpanClientNothingToDoError,
    ReservableTimeSpanClientValueError,
)
from opening_hours.models import OriginHaukiResource, ReservableTimeSpan
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import (
    HaukiAPIOpeningHoursResponseItem,
    HaukiAPIOpeningHoursResponseTime,
)
from reservation_units.enums import ReservationStartInterval

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit


# Hash value for when there are never any opening hours
# See https://github.com/City-of-Helsinki/hauki `hours.models.Resource._get_date_periods_as_hash`
NEVER_ANY_OPENING_HOURS_HASH = "d41d8cd98f00b204e9800998ecf8427e"  # md5(b"").hexdigest()


@dataclass(order=True, frozen=False)
class TimeSpanElement:
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime
    is_reservable: bool
    buffer_time_after: datetime.timedelta | None = None
    buffer_time_before: datetime.timedelta | None = None

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
        return self.start_datetime - (self.buffer_time_before if self.buffer_time_before else datetime.timedelta())

    @property
    def buffered_end_datetime(self) -> datetime.datetime:
        return self.end_datetime + (self.buffer_time_after if self.buffer_time_after else datetime.timedelta())

    @property
    def duration_minutes(self) -> float:
        return (self.end_datetime - self.start_datetime).total_seconds() / 60

    @property
    def buffered_duration_minutes(self) -> float:
        """Duration of the time span, including buffer times."""
        return (self.buffered_end_datetime - self.buffered_start_datetime).total_seconds() / 60

    @property
    def front_buffered_duration_minutes(self) -> float:
        """Duration of the time span, including buffer times before the start."""
        return (
            (self.end_datetime - self.start_datetime)
            + (self.buffer_time_before if self.buffer_time_before else datetime.timedelta())
        ).total_seconds() / 60

    @property
    def back_buffered_duration_minutes(self) -> float:
        """Duration of the time span, including buffer times after the end."""
        return (
            (self.end_datetime - self.start_datetime)
            + (self.buffer_time_after if self.buffer_time_after else datetime.timedelta())
        ).total_seconds() / 60

    def overlaps_with(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans overlap with the other time span?

                     other
                 <--timespan-->
        ------  |              |           # No
        --------|              |           # No
        --------|--            |           # Yes
        --------|--------------|           # Yes
                |              |           #
                |  ----------  |           # Yes
                |--------------|           # Yes
        --------|--------------|--------   # Yes
                |              |           #
                |--------------|--------   # Yes
                |            --|--------   # Yes
                |              |--------   # No
                |              |  ------   # No
        """
        return (
            self.buffered_start_datetime < other.buffered_end_datetime
            and self.buffered_end_datetime > other.buffered_start_datetime
        )

    def fully_inside_of(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans fully overlap with the other time span?

                     other
                 <--timespan-->
        ------  |              |           # No
        --------|              |           # No
        --------|--            |           # No
        --------|--------------|           # No
                |              |           #
                |  ----------  |           # Yes
                |--------------|           # Yes
        --------|--------------|--------   # No
                |              |           #
                |--------------|--------   # No
                |            --|--------   # No
                |              |--------   # No
                |              |  ------   # No
        """
        return (
            self.buffered_start_datetime >= other.buffered_start_datetime
            and self.buffered_end_datetime <= other.buffered_end_datetime
        )

    def starts_inside_of(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans start inside the other time span?

                     other
                 <--timespan-->
        ------  |              |           # No
        --------|              |           # No
        --------|--            |           # No
        --------|--------------|           # No
                |              |           #
                |  ----------  |           # Yes
                |--------------|           # Yes
        --------|--------------|--------   # No
                |              |           #
                |--------------|--------   # Yes
                |            --|--------   # Yes
                |              |--------   # No
                |              |  ------   # No
        """
        return other.buffered_start_datetime <= self.buffered_start_datetime < other.buffered_end_datetime

    def ends_inside_of(self, other: "TimeSpanElement") -> bool:
        """
        Does this time spans end inside the other time span?

                     other
                 <--timespan-->
        ------  |              |           # No
        --------|              |           # No
        --------|--            |           # Yes
        --------|--------------|           # Yes
                |              |           #
                |  ----------  |           # Yes
                |--------------|           # Yes
        --------|--------------|--------   # No
                |              |           #
                |--------------|--------   # No
                |            --|--------   # No
                |              |--------   # No
                |              |  ------   # No
        """
        return other.buffered_start_datetime < self.buffered_end_datetime <= other.buffered_end_datetime

    def can_fit_reservation_for_reservation_unit(
        self,
        reservation_unit: "ReservationUnit",
        minimum_duration_minutes: int,
    ) -> bool:
        """Is this timespan long enough for a reservation for the given ReservationUnit?"""
        # Minimum duration of a reservation for this ReservationUnit
        reservation_unit_minimum_duration_minutes = (
            minimum_duration_minutes
            if not reservation_unit.min_reservation_duration
            else max(reservation_unit.min_reservation_duration.total_seconds() / 60, minimum_duration_minutes)
        )

        front_buffered_reservation_unit_minimum_duration_minutes = reservation_unit_minimum_duration_minutes
        back_buffered_reservation_unit_minimum_duration_minutes = reservation_unit_minimum_duration_minutes
        if reservation_unit.buffer_time_before is not None:
            front_buffered_reservation_unit_minimum_duration_minutes += (
                reservation_unit.buffer_time_before.total_seconds() / 60
            )
        if reservation_unit.buffer_time_after is not None:
            back_buffered_reservation_unit_minimum_duration_minutes += (
                reservation_unit.buffer_time_after.total_seconds() / 60
            )

        return (
            self.duration_minutes >= reservation_unit_minimum_duration_minutes
            and self.front_buffered_duration_minutes >= front_buffered_reservation_unit_minimum_duration_minutes
            and self.back_buffered_duration_minutes >= back_buffered_reservation_unit_minimum_duration_minutes
        )

    def move_to_next_valid_start_time(self, reservation_unit: "ReservationUnit") -> None:
        """
        Move reservable time span start time to the next valid start time based on the
        given reservation unit's settings and filter time start.

        For a reservation to be valid, its start time must be at an interval that is valid for the ReservationUnit.
        e.g. When ReservationUnit.reservation_start_interval is 30 minutes,
        a reservation must start at 00:00, 00:30, 01:00, 01:30 from the start of the time span.
        """
        # If a buffer was added to the reservable time span, but the reservation units buffer is
        # longer, we need to move the start time forward to account for the difference.
        if self.buffer_time_before is not None and self.buffer_time_before < (
            reservation_unit.buffer_time_before or datetime.timedelta()
        ):
            self.start_datetime += reservation_unit.buffer_time_before - self.buffer_time_before
            self.buffer_time_before = reservation_unit.buffer_time_before

        interval = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        overflow_minutes = ceil((time_as_timedelta(self.start_datetime).total_seconds() / 60) % interval)
        if overflow_minutes == 0:
            return

        delta_to_next_interval = datetime.timedelta(minutes=interval - overflow_minutes)
        self.start_datetime += delta_to_next_interval

    def get_as_closed_time_spans(
        self,
        filter_time_start: datetime.time | None,
        filter_time_end: datetime.time | None,
    ) -> list["TimeSpanElement"]:
        """
        Generate a list of closed time spans for a time span based on given filter time values.

        This list will contain at most two time spans for every day between the start and end date of this time span.
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


class ReservableTimeSpanClient:
    DAYS_TO_FETCH = 730  # 2 years

    origin_hauki_resource: OriginHaukiResource
    start_date: datetime.date
    end_date: datetime.date

    def __init__(self, origin_hauki_resource: OriginHaukiResource):
        self.origin_hauki_resource = origin_hauki_resource

        # If the resource does not have a hash set, we should raise an error.
        if not self.origin_hauki_resource.opening_hours_hash:
            raise ReservableTimeSpanClientValueError(
                f"{self.origin_hauki_resource} does not have opening_hours_hash set."
            )
        # If the resource has never any opening hours, we can raise an error
        elif self.origin_hauki_resource.opening_hours_hash == NEVER_ANY_OPENING_HOURS_HASH:
            raise ReservableTimeSpanClientNothingToDoError(f"{self.origin_hauki_resource} never has any opening hours.")

    def run(self) -> list[ReservableTimeSpan]:
        self._init_date_range()

        # Get the opening hours from Hauki API.
        opening_hours_response = self._get_opening_hours_from_hauki_api()

        # Parse the returned data.
        parsed_time_spans: list[TimeSpanElement] = self._parse_opening_hours(opening_hours_response)

        # Split the time spans into reservable and closed time spans.
        reservable_time_spans, closed_time_spans = self._split_to_reservable_and_closed_time_spans(parsed_time_spans)

        # The Hauki data may contain conflicting data, such as overlapping reservable and closed time spans,
        # so we normalise the reservable timespans by the closed timespans.
        normalised_time_spans = override_reservable_with_closed_time_spans(reservable_time_spans, closed_time_spans)

        created_reservable_time_spans = self._create_reservable_time_spans(normalised_time_spans)

        self.origin_hauki_resource.latest_fetched_date = self.end_date
        self.origin_hauki_resource.save()

        return created_reservable_time_spans

    def _init_date_range(self):
        today = local_date()
        if self.origin_hauki_resource.latest_fetched_date:
            # Start fetching from the next day after the latest fetched date.
            self.start_date = self.origin_hauki_resource.latest_fetched_date + datetime.timedelta(days=1)
        else:
            # Since we don't have any previous data, start fetching from today.
            self.start_date = today

        self.end_date = today + datetime.timedelta(days=self.DAYS_TO_FETCH)
        # Round the date to the last day of the month (e.g. 2023-01-05 -> 2023-01-31)
        self.end_date = self.end_date.replace(day=calendar.monthrange(self.end_date.year, self.end_date.month)[1])

        if self.start_date >= self.end_date:
            raise ReservableTimeSpanClientNothingToDoError(
                f"{self.origin_hauki_resource} already has the latest reservable time spans fetched."
            )

    def _get_opening_hours_from_hauki_api(self) -> HaukiAPIOpeningHoursResponseItem:
        return HaukiAPIClient.get_resource_opening_hours(
            hauki_resource_id=self.origin_hauki_resource.id,
            start_date=self.start_date,
            end_date=self.end_date,
        )

    @staticmethod
    def _parse_opening_hours(opening_hours_response: HaukiAPIOpeningHoursResponseItem) -> list[TimeSpanElement]:
        """Parse the Hauki API response into a simplified list of TimeSpanDayElements."""
        resource_timezone = zoneinfo.ZoneInfo(opening_hours_response["resource"].get("timezone", settings.TIME_ZONE))

        time_span_list: list[TimeSpanElement] = []
        for day in opening_hours_response["opening_hours"]:
            for time_element in day["times"]:
                time_span_element = TimeSpanElement.create_from_time_element(
                    date=datetime.datetime.strptime(day["date"], "%Y-%m-%d").date(),
                    timezone=resource_timezone,
                    time_element=time_element,
                )
                if time_span_element is None:
                    continue
                time_span_list.append(time_span_element)
        return time_span_list

    @staticmethod
    def _split_to_reservable_and_closed_time_spans(
        parsed_time_spans: list[TimeSpanElement],
    ) -> tuple[list[TimeSpanElement], list[TimeSpanElement]]:
        """
        Split the time spans into reservable and closed time spans.

        The parsed time spans may contain overlapping time spans with the same state.
        We can simplify them here, by combining them into a single longer time span.
        """
        reservable_time_spans: list[TimeSpanElement] = []
        closed_time_spans: list[TimeSpanElement] = []

        # Go through all time spans in chronological order.
        for current_time_span in sorted(parsed_time_spans, key=lambda x: x.start_datetime):
            # Select which list is used
            selected_list = reservable_time_spans if current_time_span.is_reservable else closed_time_spans
            selected_list.append(current_time_span)

        # Merge overlapping time spans in both lists
        reservable_time_spans = merge_overlapping_time_span_elements(reservable_time_spans)
        closed_time_spans = merge_overlapping_time_span_elements(closed_time_spans)
        return reservable_time_spans, closed_time_spans

    def _create_reservable_time_spans(self, normalised_time_spans: list[TimeSpanElement]) -> list[ReservableTimeSpan]:
        if not normalised_time_spans:
            return []

        last_created_reservable_time_span = self.origin_hauki_resource.reservable_time_spans.last()
        # If the last created reservable time span is overlapping with our first normalised time span,
        # extend it instead of creating a new time span.
        if last_created_reservable_time_span is not None:
            first_normalised_time_span = normalised_time_spans[0]
            if last_created_reservable_time_span.end_datetime >= first_normalised_time_span.start_datetime:
                last_created_reservable_time_span.end_datetime = first_normalised_time_span.end_datetime
                last_created_reservable_time_span.save()
                normalised_time_spans.pop(0)

        reservable_time_spans = [
            ReservableTimeSpan(
                resource=self.origin_hauki_resource,
                start_datetime=ts.start_datetime,
                end_datetime=ts.end_datetime,
            )
            for ts in normalised_time_spans
        ]

        return ReservableTimeSpan.objects.bulk_create(reservable_time_spans)


def merge_overlapping_time_span_elements(time_span_elements: list[TimeSpanElement]) -> list[TimeSpanElement]:
    """
    Merge overlapping time spans into a single time span.

    The time spans must be in chronological order.
    """
    if not time_span_elements:
        return []

    merged_time_span_elements: list[TimeSpanElement] = []
    for current_time_span in time_span_elements:
        # If the selected_list is empty, simply append the current time span
        if not merged_time_span_elements:
            merged_time_span_elements.append(current_time_span)
            continue

        # If the selected_list contains a time span that overlaps with the current time span, combine them.
        # The only time span that can overlap with the current time span is the last time span in the list.
        # ┌────────────────────────┬─────────────────────────────────────────────┐
        # │  xxxx     ->  xxxxxxx  │ Overlapping                                 │
        # │    xxxxx  ->           │ The last time span is extended              │
        # ├────────────────────────┼─────────────────────────────────────────────┤
        # │  xxxx     ->  xxxxxxx  │ Current ends at the same time last ends     │
        # │      xxx  ->           │ The last time span is extended              │
        # ├────────────────────────┼─────────────────────────────────────────────┤
        # │  xxxxxxx  ->  xxxxxxx  │ Time span is fully inside the last one      │
        # │    xxx    ->           │                                             │
        # └────────────────────────┴─────────────────────────────────────────────┘
        last_time_span = merged_time_span_elements[-1]
        # Last time span can maybe be extended
        if last_time_span.end_datetime >= current_time_span.start_datetime:
            # Last time span fully contains this time span, skip it.
            if last_time_span.end_datetime > current_time_span.end_datetime:
                continue
            # Last time span is expanded
            last_time_span.end_datetime = current_time_span.end_datetime
            continue

        # No overlapping time spans, add the current time span to the list.
        # ┌────────────────────────┬─────────────────────────────────────┐
        # │  xxxx     ->  xxxx     │ Not overlapping                     │
        # │       xx  ->       xx  │ Current time span is added to list  │
        # └────────────────────────┴─────────────────────────────────────┘
        merged_time_span_elements.append(current_time_span)

    return merged_time_span_elements


def override_reservable_with_closed_time_spans(
    reservable_time_spans: list[TimeSpanElement],
    closed_time_spans: list[TimeSpanElement],
) -> list[TimeSpanElement]:
    """
    Normalize the given reservable timespans by shortening/splitting/removing them depending on if and how they
    overlap with any of the given closed time spans.

    We have no way to know if this is actually the correct way to handle conflicts, but it's our best assumption.
    e.g. Normally open every weekday, but closed on friday due to a public holiday.

    The reservable and closed time spans are not required to be chronological order.
    The reservable time spans should not have any overlapping timespans at this stage.

    Returned reservable timespans are in chronological order.
    """
    for closed_time_span in closed_time_spans:
        for reservable_index, reservable_time_span in (gen := with_indices(reservable_time_spans)):
            if reservable_time_span is None:
                continue

            # Skip the closed time spans that are fully outside the reservable time span.
            if not reservable_time_span.overlaps_with(closed_time_span):
                continue

            # The reservable time span is fully inside the closed time span, remove it.
            if reservable_time_span.fully_inside_of(closed_time_span):
                del reservable_time_spans[reservable_index]
                gen.item_deleted = True
                continue

            # Closed time span is fully inside the reservable time span, split the reservable time span
            # ┌────────────────────┬───────────────────────────────────────────────┐
            # │ ooooooo -> oo   oo │ Closed time span inside reservable time span. │
            # │   xxx   ->   xxx   │ Reservable time span is split in two          │
            # ├────────────────────┼───────────────────────────────────────────────┤
            # │ ooooooo -> o  o  o │ Multiple closed time spans overlap            │
            # │  xx     ->  xx     │ reservable time span is split in three.       │
            # │     xx  ->     xx  │ (in different loops)                          │
            # └────────────────────┴───────────────────────────────────────────────┘
            elif closed_time_span.fully_inside_of(reservable_time_span):
                new_reservable_time_span = copy(reservable_time_span)
                reservable_time_spans.append(new_reservable_time_span)
                # Split the reservable time span in two
                # Save the buffers on the reservable times, so that we can check if another buffered timespan
                # (i.e. a reservation's timespan) would fit between this and the next/previous time span
                reservable_time_span.end_datetime = closed_time_span.buffered_start_datetime
                new_reservable_time_span.start_datetime = closed_time_span.buffered_end_datetime
                reservable_time_span.buffer_time_after = closed_time_span.buffer_time_before
                new_reservable_time_span.buffer_time_before = closed_time_span.buffer_time_after

            # Reservable time span starts inside the closed time span.
            # Shorten the reservable time span from the beginning
            # ┌──────────────────────────┬───────────────────────────────────┐
            # │     oooo   ->       oo   │                                   │
            # │   xxxx     ->   xxxx     │ Reservable time span is shortened │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │     oooo   ->     oooo   │ Not overlapping (or start == end) │
            # │ xxxx       -> xxxx       │ Untouched                         │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │     oooo   ->     oooo   │ Overlapping from the beginning    │
            # │       xxxx ->       xxxx │ Handled later in the next step    │
            # └──────────────────────────┴───────────────────────────────────┘
            elif reservable_time_span.starts_inside_of(closed_time_span):
                # Save the buffer on the reservable time, so that we can check if another buffered timespan
                # (i.e. a reservation's timespan) would fit between this and the previous time span
                reservable_time_span.start_datetime = closed_time_span.buffered_end_datetime
                reservable_time_span.buffer_time_before = closed_time_span.buffer_time_after

            # Reservable time span ends inside the closed time span.
            # Shorten the reservable time span from the end
            # ┌──────────────────────────┬───────────────────────────────────┐
            # │   oooo     ->   oo       │                                   │
            # │     xxxx   ->     xxxx   │ Reservable time span is shortened │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │   oooo     ->   oooo     │ Not overlapping (or end == start) │
            # │       xxxx ->       xxxx │ Untouched                         │
            # ├──────────────────────────┼───────────────────────────────────┤
            # │   oooo     ->   oooo     │ Overlapping from the beginning    │
            # │ xxxx       -> xxxx       │ Already handled in last step      │
            # └──────────────────────────┴───────────────────────────────────┘
            elif reservable_time_span.ends_inside_of(closed_time_span):
                # Save the buffer on the reservable time, so that we can check if another buffered timespan
                # (i.e. a reservation's timespan) would fit between this and the next time span
                reservable_time_span.end_datetime = closed_time_span.buffered_start_datetime
                reservable_time_span.buffer_time_after = closed_time_span.buffer_time_before

            # If the duration of the reservable time span is negative or zero after adjustments
            # (buffered time is ignored here), remove it.
            if reservable_time_span.start_datetime >= reservable_time_span.end_datetime:
                del reservable_time_spans[reservable_index]
                gen.item_deleted = True
                continue

    # Sort the time spans once more to ensure they are in chronological order.
    # Remove any timespans that have a duration of zero (or less).
    reservable_time_spans[:] = sorted(
        (ts for ts in reservable_time_spans if ts.start_datetime < ts.end_datetime),
        key=lambda ts: ts.start_datetime,
    )

    return reservable_time_spans
