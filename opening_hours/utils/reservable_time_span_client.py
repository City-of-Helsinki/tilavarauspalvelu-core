import calendar
import datetime
import zoneinfo
from copy import copy
from typing import TYPE_CHECKING

from django.conf import settings

from common.date_utils import (
    local_date,
)
from common.utils import with_indices
from opening_hours.errors import (
    ReservableTimeSpanClientNothingToDoError,
    ReservableTimeSpanClientValueError,
)
from opening_hours.models import OriginHaukiResource, ReservableTimeSpan
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import (
    HaukiAPIOpeningHoursResponseItem,
)
from opening_hours.utils.time_span_element import TimeSpanElement

if TYPE_CHECKING:
    pass


# Hash value for when there are never any opening hours
# See https://github.com/City-of-Helsinki/hauki `hours.models.Resource._get_date_periods_as_hash`
NEVER_ANY_OPENING_HOURS_HASH = "d41d8cd98f00b204e9800998ecf8427e"  # md5(b"").hexdigest()


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
                gen.delete_item(reservable_index)
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
                reservable_time_span.end_datetime = closed_time_span.buffered_start_datetime
                new_reservable_time_span.start_datetime = closed_time_span.buffered_end_datetime

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
                reservable_time_span.start_datetime = closed_time_span.buffered_end_datetime

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
                reservable_time_span.end_datetime = closed_time_span.buffered_start_datetime

            # If the duration of the reservable time span is negative or zero after adjustments
            # (buffered time is ignored here), remove it.
            if reservable_time_span.start_datetime >= reservable_time_span.end_datetime:
                gen.delete_item(reservable_index)
                continue

    # Sort the time spans once more to ensure they are in chronological order.
    # Remove any timespans that have a duration of zero (or less).
    reservable_time_spans[:] = sorted(
        (ts for ts in reservable_time_spans if ts.start_datetime < ts.end_datetime),
        key=lambda ts: ts.start_datetime,
    )

    return reservable_time_spans
