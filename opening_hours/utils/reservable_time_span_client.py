import calendar
import datetime
from copy import copy
from dataclasses import dataclass
from typing import Optional
from zoneinfo import ZoneInfo

from django.utils import timezone
from django.utils.timezone import get_default_timezone

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

DEFAULT_TIMEZONE = get_default_timezone()

# Hash value for when there are never any opening hours
# See https://github.com/City-of-Helsinki/hauki `hours.models.Resource._get_date_periods_as_hash`
NEVER_ANY_OPENING_HOURS_HASH = "d41d8cd98f00b204e9800998ecf8427e"  # md5(b"").hexdigest()


@dataclass(order=True, frozen=False)
class TimeSpanElement:
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime
    is_reservable: bool

    def __repr__(self):
        return (
            f"TimeSpanElement(start_datetime={self.start_datetime}, "
            f"end_datetime={self.end_datetime}, is_reservable={self.is_reservable})"
        )

    def __copy__(self) -> "TimeSpanElement":
        return TimeSpanElement(
            start_datetime=self.start_datetime,
            end_datetime=self.end_datetime,
            is_reservable=self.is_reservable,
        )

    @classmethod
    def create_from_time_element(
        cls,
        date: datetime.date,
        timezone: ZoneInfo,
        time_element: HaukiAPIOpeningHoursResponseTime,
    ) -> Optional["TimeSpanElement"]:
        # We only care if the resource is reservable or closed on the time frame.
        # That means we can ignore all other states (OPEN, SELF_SERVICE, WEATHER_PERMITTING, etc.)
        time_element_state = HaukiResourceState.get(time_element["resource_state"])
        if not time_element_state.is_reservable and not time_element_state.is_closed:
            return None

        start_time: str = time_element["start_time"]
        end_time: str = time_element["end_time"]

        full_day: bool = time_element["full_day"] or (start_time is None and end_time is None)

        start_time: datetime.time = (
            datetime.time(0)
            if (full_day or not start_time)
            else datetime.datetime.strptime(start_time, "%H:%M:%S").time()
        )
        start_datetime = datetime.datetime.combine(date, start_time, tzinfo=timezone)

        if time_element["end_time_on_next_day"] or full_day:
            date += datetime.timedelta(days=1)

        end_time: datetime.time = (
            datetime.time(0) if (full_day or not end_time) else datetime.datetime.strptime(end_time, "%H:%M:%S").time()
        )
        end_datetime = datetime.datetime.combine(date, end_time, tzinfo=timezone)

        # If the time span duration would be zero or negative, return None.
        if start_datetime >= end_datetime:
            return None

        return TimeSpanElement(
            start_datetime=start_datetime.astimezone(DEFAULT_TIMEZONE),
            end_datetime=end_datetime.astimezone(DEFAULT_TIMEZONE),
            is_reservable=time_element_state.is_reservable,
        )


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

        # Normalise the parsed time spans into a list of clean reservable TimeSpanElements.
        normalised_time_spans = self._override_reservable_with_closed_time_spans(
            reservable_time_spans, closed_time_spans
        )

        created_reservable_time_spans = self._create_reservable_time_spans(normalised_time_spans)

        self.origin_hauki_resource.latest_fetched_date = self.end_date
        self.origin_hauki_resource.save()

        return created_reservable_time_spans

    def _init_date_range(self):
        today = timezone.now().date()
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
        return HaukiAPIClient().get_resource_opening_hours(
            hauki_resource_id=self.origin_hauki_resource.id,
            start_date=self.start_date,
            end_date=self.end_date,
        )

    @staticmethod
    def _parse_opening_hours(opening_hours_response: HaukiAPIOpeningHoursResponseItem) -> list[TimeSpanElement]:
        """Parse the Hauki API response into a simplified list of TimeSpanDayElements."""
        resource_timezone = ZoneInfo(opening_hours_response["resource"].get("timezone", DEFAULT_TIMEZONE.key))

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
        We can simplify them, by combining them into a single longer time span.
        """
        reservable_time_spans: list[TimeSpanElement] = []
        closed_time_spans: list[TimeSpanElement] = []

        # Go through all time spans in chronological order.
        for current_time_span in sorted(parsed_time_spans, key=lambda x: x.start_datetime):
            # Select which list is used
            selected_list = reservable_time_spans if current_time_span.is_reservable else closed_time_spans

            # If the selected_list is empty, simply append the current time span
            if not selected_list:
                selected_list.append(current_time_span)
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
            last_time_span = selected_list[-1]
            # Last time span can maybe be extended
            if last_time_span.end_datetime >= current_time_span.start_datetime:
                # Last time span fully contains this time span, skip it.
                if last_time_span.end_datetime > current_time_span.end_datetime:
                    continue
                # Last time span is expanded
                last_time_span.end_datetime = current_time_span.end_datetime
                continue

            # No overlapping time spans, add the current time span to the tracked list.
            # ┌────────────────────────┬─────────────────────────────────────────────┐
            # │  xxxx     ->  xxxx     │ Not overlapping                             │
            # │       xx  ->       xx  │ Current time span is added to tracked list  │
            # └────────────────────────┴─────────────────────────────────────────────┘
            selected_list.append(current_time_span)

        return reservable_time_spans, closed_time_spans

    @staticmethod
    def _override_reservable_with_closed_time_spans(
        reservable_time_spans: list[TimeSpanElement | None],
        closed_time_spans: list[TimeSpanElement],
    ) -> list[TimeSpanElement]:
        """
        Go through all the time spans and normalise them into a list of clean reservable TimeSpanElements.

        The Hauki data may contain conflicting data, such as overlapping time spans with different states,
        so we need to clean it before it can be used.

        When time spans of different states overlap, the closed time spans always override the reservable time spans.
        If the closed time span is fully inside the reservable time span, the reservable time span is split in two,
        otherwise the reservable time span is shortened from the beginning or end.

        We have no way to know if this is actually the correct way to handle conflicts, but it's our best assumption.
        e.g. Normally open every weekday, but closed on friday due to a public holiday.
        """
        i: int
        reservable_time_span: TimeSpanElement
        for closed_time_span in closed_time_spans:
            for i, reservable_time_span in enumerate(reservable_time_spans):
                if reservable_time_span is None:
                    continue

                # Skip the closed time spans that are fully outside the reservable time span.
                # ┌────────────────────────┬────────────┐
                # │    ooo    ->    ooo    │            │
                # │ xx        ->           │ Skipped    │
                # │  xxx      ->  xxx      │ Ok         │
                # │    xxx    ->    xxx    │ Ok         │
                # │      xxx  ->      xxx  │ Ok         │
                # │        xx ->           │ Skipped    │
                # └────────────────────────┴────────────┘
                if (
                    reservable_time_span.start_datetime > closed_time_span.end_datetime
                    or reservable_time_span.end_datetime < closed_time_span.start_datetime
                ):
                    continue

                # The reservable time span is fully inside the closed time span, remove it.
                # ┌──────────────────────────┬───────────────────────────────────┐
                # │    ooo     ->            │ Reservable fully inside closed    │
                # │  xxxxxxx   ->  xxxxxxx   │ Reservable time removed           │
                # ├──────────────────────────┼───────────────────────────────────┤
                # │   oooo     ->            │ Reservable fully inside closed    │
                # │   xxxx     ->   xxxx     │ Reservable time removed           │
                # └──────────────────────────┴───────────────────────────────────┘
                if (
                    closed_time_span.start_datetime <= reservable_time_span.start_datetime
                    and closed_time_span.end_datetime >= reservable_time_span.end_datetime
                ):
                    reservable_time_spans[i] = None

                # Closed time span is fully inside the reservable time span, split the reservable time span
                # ┌────────────────────┬───────────────────────────────────────────────┐
                # │ ooooooo -> oo   oo │ Closed time span inside reservable time span. │
                # │   xxx   ->   xxx   │ Reservable time span is split in two          │
                # ├────────────────────┼───────────────────────────────────────────────┤
                # │ ooooooo -> o  o  o │ Multiple closed time spans overlap            │
                # │  xx     ->  xx     │ reservable time span is split in three.       │
                # │     xx  ->     xx  │ (in different loops)                          │
                # └────────────────────┴───────────────────────────────────────────────┘
                elif (
                    reservable_time_span.start_datetime < closed_time_span.start_datetime
                    and reservable_time_span.end_datetime > closed_time_span.end_datetime
                ):
                    new_reservable_time_span = copy(reservable_time_span)
                    reservable_time_span.end_datetime = closed_time_span.start_datetime
                    new_reservable_time_span.start_datetime = closed_time_span.end_datetime
                    reservable_time_spans.append(new_reservable_time_span)

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
                elif (
                    closed_time_span.start_datetime
                    <= reservable_time_span.start_datetime
                    < closed_time_span.end_datetime
                ):
                    reservable_time_span.start_datetime = closed_time_span.end_datetime

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
                elif (
                    closed_time_span.start_datetime < reservable_time_span.end_datetime <= closed_time_span.end_datetime
                ):
                    reservable_time_span.end_datetime = closed_time_span.start_datetime

                # If the duration of the reservable time span is negative or zero after adjustments, remove it.
                if reservable_time_span.start_datetime >= reservable_time_span.end_datetime:
                    reservable_time_spans[i] = None

        # Filter out all None values
        reservable_time_spans[:] = [ts for ts in reservable_time_spans if ts is not None]

        # Sort the time spans once more to ensure they are in correct order.
        reservable_time_spans[:] = sorted(reservable_time_spans, key=lambda ts: ts.start_datetime)

        return reservable_time_spans

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
