from __future__ import annotations

import calendar
import datetime
import zoneinfo
from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.constants import NEVER_ANY_OPENING_HOURS_HASH
from tilavarauspalvelu.exceptions import ReservableTimeSpanClientNothingToDoError, ReservableTimeSpanClientValueError
from tilavarauspalvelu.models import ReservableTimeSpan
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.utils.opening_hours.time_span_element_utils import (
    merge_overlapping_time_span_elements,
    override_reservable_with_closed_time_spans,
)
from utils.date_utils import local_date

if TYPE_CHECKING:
    from tilavarauspalvelu.models import OriginHaukiResource
    from tilavarauspalvelu.utils.opening_hours.hauki_api_types import HaukiAPIOpeningHoursResponseItem


class ReservableTimeSpanClient:
    DAYS_TO_FETCH = 730  # 2 years

    origin_hauki_resource: OriginHaukiResource
    start_date: datetime.date
    end_date: datetime.date

    def __init__(self, origin_hauki_resource: OriginHaukiResource) -> None:
        self.origin_hauki_resource = origin_hauki_resource

        # If the resource does not have a hash set, we should raise an error.
        if not self.origin_hauki_resource.opening_hours_hash:
            msg = f"{self.origin_hauki_resource} does not have opening_hours_hash set."
            raise ReservableTimeSpanClientValueError(msg)
        # If the resource has never any opening hours, we can raise an error
        if self.origin_hauki_resource.opening_hours_hash == NEVER_ANY_OPENING_HOURS_HASH:
            msg = f"{self.origin_hauki_resource} never has any opening hours."
            raise ReservableTimeSpanClientNothingToDoError(msg)

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

    def _init_date_range(self) -> None:
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
            msg = f"{self.origin_hauki_resource} already has the latest reservable time spans fetched."
            raise ReservableTimeSpanClientNothingToDoError(msg)

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

    def _merge_overlapping_closed_time_spans(self, parsed_time_spans: list[TimeSpanElement]) -> list[TimeSpanElement]:
        return merge_overlapping_time_span_elements(
            timespan for timespan in parsed_time_spans if not timespan.is_reservable
        )
