from __future__ import annotations

import datetime
import json
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from django.core.cache import cache
from django.db import models
from graphene_django.settings import graphene_settings
from lookup_property import L
from query_optimizer.utils import calculate_queryset_slice

from applications.enums import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.date_utils import local_datetime, local_datetime_max, local_datetime_min, local_start_of_day
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.time_span_element import TimeSpanElement
from opening_hours.utils.time_span_element_utils import merge_overlapping_time_span_elements
from reservation_units.utils.first_reservable_time_helper.first_reservable_time_reservation_unit_helper import (
    ReservationUnitFirstReservableTimeHelper,
)
from reservations.models import AffectingTimeSpan

if TYPE_CHECKING:
    from decimal import Decimal

    from django.db.models import QuerySet, When
    from query_optimizer.validators import PaginationArgs

    from reservation_units.models import ReservationUnit
    from reservation_units.querysets import ReservationUnitQuerySet

type ReservationUnitPK = int


@dataclass
class CachedReservableTime:
    frt: datetime.datetime | None
    closed: bool
    valid_until: datetime.datetime

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CachedReservableTime:
        return cls(
            frt=None if data["frt"] == "None" else datetime.datetime.fromisoformat(data["frt"]),
            closed=data["closed"].lower() == "true",
            valid_until=datetime.datetime.fromisoformat(data["valid_until"]),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "frt": self.frt.isoformat() if self.frt is not None else "None",
            "closed": str(self.closed),
            "valid_until": self.valid_until.isoformat(),
        }


class FirstReservableTimeHelper:
    """
    Helper class for finding the first reservable time and closed status for each ReservationUnit in a given queryset.

    The calculation results are saved in the `first_reservable_times` and `reservation_unit_closed_statuses` dicts.
    These results can then be used to annotate the queryset using the `get_annotated_queryset` method.

    This helper works by first generating a list of CLOSED time spans for each ReservationUnit and then one by one
    checking the RESERVABLE time spans for a time span that is not overlapping with closed time spans and is still
    long enough to fulfill the minimum duration criteria.

    The list of closed time spans are generated from:
    - Given filter value
    - ReservationUnit settings
    - ReservationUnit's ApplicationRounds
    - Reservations from ReservationUnits with common hierarchy
    After removing the closed time spans, the first reservable time span that is long enough to fit the minimum
    duration is selected as the `first_reservable_datetime`.

    ---

    Variables which affect the first reservable time span and also can cause
    the ReservationUnit to be "closed" if no valid reservable times are found because of them:
    ┌──────────────────┬──────────────────────────────┐
    │ Source           │ Value                        │
    ├──────────────────┼──────────────────────────────┤
    │ Filters          │ filter_date_start            │
    │                  │ filter_date_end              │
    │                  │ filter_time_start            │
    │                  │ filter_time_end              │
    ├──────────────────┼──────────────────────────────┤
    │ ReservationUnit  │ reservation_begins           │
    │                  │ reservation_ends             │
    │                  │ publish_ends                 │
    ├──────────────────┼──────────────────────────────┤
    │ ApplicationRound │ reservation_period_begin     │
    │                  │ reservation_period_end       │
    └──────────────────┴──────────────────────────────┘

    Variables which only affect the first reservable time span, but allow
    the ReservationUnit to be "open" if there would otherwise be valid time spans on the filtered date range:
    ┌──────────────────┬──────────────────────────────┐
    │ Source           │ Value                        │
    ├──────────────────┼──────────────────────────────┤
    │ Filters          │ minimum_duration_minutes     │
    ├──────────────────┼──────────────────────────────┤
    │ ReservationUnit  │ min_reservation_duration     │
    │                  │ max_reservation_duration     │
    │                  │ reservation_start_interval   │
    │                  │ reservations_min_days_before │
    │                  │ reservations_max_days_before │
    │                  │ buffer_time_before           │ (when comparing with non-blocking Reservations)
    │                  │ buffer_time_after            │ (when comparing with non-blocking Reservations)
    ├──────────────────┼──────────────────────────────┤
    │ Reservation      │ begin                        │ (from ReservationUnits with common hierarchy)
    │                  │ end                          │
    │                  │ buffer_time_before           │
    │                  │ buffer_time_after            │
    └──────────────────┴──────────────────────────────┘
    """

    # Date and Time filters are used to filter a range of dates and time that the reservation must be within.
    filter_date_start: datetime.date
    filter_date_end: datetime.date
    filter_time_start: datetime.time | None
    filter_time_end: datetime.time | None
    filter_minimum_duration_minutes: int

    # QuerySet passed to the helper
    original_reservation_unit_queryset: ReservationUnitQuerySet
    # ReservationUnits with prefetched ReservableTimeSpans and ApplicationRounds
    optimized_reservation_unit_queryset: ReservationUnitQuerySet

    # Contains a set of closed time spans for each ReservationUnit generated from their relevant Reservations
    reservation_closed_time_spans_map: dict[ReservationUnitPK, list[TimeSpanElement]]
    # Contains a set of closed time spans for each ReservationUnit generated from their relevant BLOCKING Reservations
    blocking_reservation_closed_time_spans_map: dict[ReservationUnitPK, list[TimeSpanElement]]

    # Contains a list of the first reservable time for each ReservationUnit.
    first_reservable_times: dict[ReservationUnitPK, datetime]
    # Contains a list of the closed status for each ReservationUnit.
    reservation_unit_closed_statuses: dict[ReservationUnitPK, bool]
    # Contains a list of hard closed time spans that are shared by all ReservationUnits.
    shared_hard_closed_time_spans: list[TimeSpanElement]

    def __init__(
        self,
        reservation_unit_queryset: ReservationUnitQuerySet,
        filter_date_start: datetime.date | None = None,
        filter_date_end: datetime.date | None = None,
        filter_time_start: datetime.time | None = None,
        filter_time_end: datetime.time | None = None,
        minimum_duration_minutes: float | Decimal | None = None,
        show_only_reservable: bool = False,
        pagination_args: PaginationArgs | None = None,
        cache_key: str = "",
    ) -> None:
        self.now = local_datetime()
        today = self.now.date()
        two_years_from_now = today + datetime.timedelta(days=731)  # 2 years + 1 day as a buffer

        #########################
        # Default filter values #
        #########################

        if filter_date_start is None:
            filter_date_start = today
        if filter_date_end is None:
            filter_date_end = two_years_from_now

        # Time inputs are interpreted as local time even if they have timezone information.
        # This is because we cannot know whether the time might be daylight saving time or not.
        # Still, we remove any timezone information from the time input and add it back when we need it.
        # (See. `tests.test_utils.test_date_util.test_compare_times`)
        if filter_time_start is not None:
            filter_time_start = filter_time_start.replace(tzinfo=None)
        if filter_time_end is not None:
            filter_time_end = filter_time_end.replace(tzinfo=None)

        ##########################
        # Validate filter values #
        ##########################

        if filter_date_start < today:
            raise ValueError("'reservable_date_start' must be not be in the past.")
        if filter_date_end < today:
            raise ValueError("'reservable_date_end' must be not be in the past.")
        if filter_date_end > two_years_from_now:
            raise ValueError("'reservable_date_end' must be not be more than two years in the future.")
        if filter_date_start > filter_date_end:
            raise ValueError("'reservable_date_start' must be before 'reservable_date_end'.")

        if filter_time_start is not None and filter_time_end is not None and filter_time_start >= filter_time_end:
            raise ValueError("'reservable_time_start' must be before 'reservable_time_end'.")

        if minimum_duration_minutes is not None and int(minimum_duration_minutes) < 15:
            raise ValueError("'minimum_duration_minutes' can not be less than '15'.")

        # Shortest possible reservation unit interval is 15 minutes, so it's used as the default value
        minimum_duration_minutes = int(minimum_duration_minutes) if minimum_duration_minutes else 15

        self.filter_date_start = filter_date_start
        self.filter_date_end = filter_date_end
        self.filter_time_start = filter_time_start
        self.filter_time_end = filter_time_end
        self.filter_minimum_duration_minutes = minimum_duration_minutes
        self.show_only_reservable = show_only_reservable

        self.cache_key = cache_key

        ##############
        # Pagination #
        ##############

        if pagination_args is not None:
            pagination_args["size"] = graphene_settings.RELAY_CONNECTION_MAX_LIMIT
            qs_slice = calculate_queryset_slice(**pagination_args)
            self.start_offset = qs_slice.start
            self.stop_offset = qs_slice.stop
            self.needed_reservation_units = self.stop_offset - self.start_offset
            # If we should only show reservable reservation units, increase the chunk size to max page size
            # so that if filtering occurs, we don't need to fetch so many chunks.
            self.chunk_size = (
                graphene_settings.RELAY_CONNECTION_MAX_LIMIT
                if self.show_only_reservable
                else self.needed_reservation_units
            )
        else:
            self.start_offset = 0
            self.stop_offset = reservation_unit_queryset.count()
            self.needed_reservation_units = self.stop_offset
            self.chunk_size = self.stop_offset

        ##########################################
        # Get required objects from the database #
        ##########################################

        self.original_reservation_unit_queryset = reservation_unit_queryset
        self.optimized_reservation_unit_queryset = self._get_reservation_unit_queryset_for_calculation()

        self.reservation_closed_time_spans_map = {}
        self.blocking_reservation_closed_time_spans_map = {}

        ##################################
        # Initialise important variables #
        ##################################

        self.first_reservable_times = {}
        self.reservation_unit_closed_statuses = {}

        # Closed time spans that are shared by all ReservationUnits
        self.shared_hard_closed_time_spans = self._get_shared_hard_closed_time_spans()

    def calculate_all_first_reservable_times(self) -> None:
        """
        Calculate the `first_reservable_time` and `is_closed` for each ReservationUnit in the queryset.
        The results are then saved to `first_reservable_times` and `reservation_unit_closed_statuses` dicts.
        """
        # FRT calculation should run last in the queryset optimization pipeline, so that
        # all possible filtering is already done.
        #
        # Still, we cannot simply limit the queryset here based on the input pagination args,
        # since the reservation unit queryset can change if we used the the optional 'show_only_reservable'
        # filter to remove non-reservable reservation units, which we only know after
        # the FRT calculation is done.
        #
        # Therefore, if 'show_only_reservable' is False, we should process the reservation units in batches,
        # starting from where the pagination args tell us, and continuing until we have gathered enough results to
        # fill the page size.
        qs = self.optimized_reservation_unit_queryset

        if not AffectingTimeSpan.is_valid():
            AffectingTimeSpan.refresh()
            cache.delete(self.cache_key)

        has_valid_results_for_previous_pages = self._read_cached_results()
        if has_valid_results_for_previous_pages:
            # If we already have cached FRT results for enough reservation units to fill the page
            # AND all the previous pages, then we don't need to calculate anything.
            # NOTE: This does not support different orderings of the same queryset!
            if len(self.first_reservable_times) >= self.stop_offset:
                return

            # Otherwise, we can still skip looping through the previous pages.
            qs = qs[self.start_offset :]
            self.start_offset = 0  # Remove offset since we skip the previous pages

        # If we don't have valid results, and this is not the first page,
        # we should fetch the current and previous pages in on chunk. The next chunk
        # will also be bigger (if needed), but likely small enough (<100) not to cause any problems.
        elif self.start_offset > 0:
            self.chunk_size = self.stop_offset

        results: int = 0
        for reservation_unit in qs.hooked_iterator(self._get_affecting_time_spans, chunk_size=self.chunk_size):
            helper = ReservationUnitFirstReservableTimeHelper(parent=self, reservation_unit=reservation_unit)
            is_closed, first_reservable_time = helper.calculate_first_reservable_time()

            self.reservation_unit_closed_statuses[reservation_unit.pk] = is_closed
            self.first_reservable_times[reservation_unit.pk] = first_reservable_time

            # Start offset should exist only if we need to recalculate previous pages.
            # -> Don't count the result for the current page.
            if self.start_offset > 0:
                self.start_offset -= 1
                continue

            # If we should only show reservable reservation units, then we should count the result for the
            # current page only if there is a first reservable time.
            if not self.show_only_reservable or first_reservable_time is not None:
                results += 1

            # This only really matters when showing only reservable reservation units,
            # since we might need to fetch more than the first chunk size.
            if results >= self.needed_reservation_units:
                break

        self._cache_results()

    def _read_cached_results(self) -> bool:
        """
        Reads cached FRT results into the helper's memory.

        Check that we have valid results for all the previous pages.
        If not, we must recalculate results for all previous pages, since they might be different
        if one FRT has changed to None or from None to a valid value.
        """
        cached_data: dict[ReservationUnitPK, dict[str, Any]] = json.loads(cache.get(self.cache_key, "{}"))

        has_valid_results_for_previous_pages = bool(cached_data)
        for pk, item in cached_data.items():
            cached_result = CachedReservableTime.from_dict(item)
            if cached_result.valid_until < self.now:
                self.reservation_unit_closed_statuses.clear()
                self.first_reservable_times.clear()
                return False

            self.reservation_unit_closed_statuses[pk] = cached_result.closed
            self.first_reservable_times[pk] = cached_result.frt

        return has_valid_results_for_previous_pages

    def _cache_results(self) -> None:
        """Save the calculated results to the cache."""
        cached_data: dict[ReservationUnitPK, dict[str, Any]] = {}
        is_valid = self.now + datetime.timedelta(minutes=2)

        for pk, frt in self.first_reservable_times.items():
            is_closed = self.reservation_unit_closed_statuses[pk]
            cached_data[pk] = CachedReservableTime(frt=frt, closed=is_closed, valid_until=is_valid).to_dict()

        cache.set(self.cache_key, json.dumps(cached_data), timeout=120)

    def get_annotated_queryset(self) -> ReservationUnitQuerySet | QuerySet[ReservationUnit]:
        """Annotate the queryset with `first_reservable_datetime` and `is_closed` fields."""
        # Create When statements for the queryset annotation
        is_closed_whens: list[When] = [
            models.When(pk=pk, then=models.Value(is_closed))
            for pk, is_closed in self.reservation_unit_closed_statuses.items()
        ]
        first_reservable_time_whens: list[When] = [
            models.When(pk=pk, then=models.Value(start_datetime))
            for pk, start_datetime in self.first_reservable_times.items()
        ]

        return self.original_reservation_unit_queryset.annotate(
            is_closed=models.Case(
                *is_closed_whens,
                default=True,
                output_field=models.BooleanField(),
            ),
            first_reservable_datetime=models.Case(
                *first_reservable_time_whens,
                default=None,
                output_field=models.DateTimeField(),
            ),
        )

    def _get_reservation_unit_queryset_for_calculation(self) -> ReservationUnitQuerySet:
        """
        Queryset with required information for calculating first reservable time.
        - Prefetch ReservableTimeSpans and ApplicationRounds for each ReservationUnit and filter them by date range
        - Annotate reservation from affecting reservation units as time spans.

        When `reservation_unit.origin_hauki_resource.reservable_time_spans` or `reservation_unit.application_rounds`
        are accessed later, they are already filtered by date range, so we don't need to query the database again.
        """
        return (
            # "Reset" queryset by removing prefetch_related, select_related, and deferred fields
            # added by the optimizer. Leaves any filters and ordering intact.
            self.original_reservation_unit_queryset.defer(None)
            .select_related(None)
            .prefetch_related(None)
            .prefetch_related(
                # Required for calculating first reservable time
                models.Prefetch(
                    "origin_hauki_resource__reservable_time_spans",
                    ReservableTimeSpan.objects.overlapping_with_period(
                        start=self.filter_date_start,
                        end=self.filter_date_end,
                    ).order_by("start_datetime"),
                ),
                models.Prefetch(
                    "application_rounds",
                    ApplicationRound.objects.filter(
                        reservation_period_begin__lte=self.filter_date_end,
                        reservation_period_end__gte=self.filter_date_start,
                    ).exclude(L(status=ApplicationRoundStatusChoice.RESULTS_SENT.value)),
                ),
            )
        )

    def _get_shared_hard_closed_time_spans(self) -> list[TimeSpanElement]:
        """
        Build a list of hard closed time spans that are shared by all ReservationUnits.

        This method always returns two time spans,
        1. From: The Big Bang
           To: The start of the filter date range or now (whichever is later)
        2. From: The filter date end or now (whichever is earlier)
           To: The end of the universe
        """
        now = local_datetime()

        return [
            TimeSpanElement(
                start_datetime=local_datetime_min(),
                end_datetime=max(local_start_of_day(self.filter_date_start), now),
                is_reservable=False,
            ),
            TimeSpanElement(
                start_datetime=local_start_of_day(self.filter_date_end) + datetime.timedelta(days=1),
                end_datetime=local_datetime_max(),
                is_reservable=False,
            ),
        ]

    def _get_affecting_time_spans(self, reservation_units: list[ReservationUnit]) -> None:
        """
        Find all AffectingTimeSpans for the given ReservationUnits and convert them to a dicts of
        "closed" and "blocking" TimeSpanElements by the affected ReservationUnit's primary key.

        Note: The PK->TimeSpanElements dicts only contain entries for the given ReservationUnits,
        even if the TimeSpanElement would affect other ReservationUnits as well. This is done to allow
        fetching the elements in batches, while also merging overlapping elements for each ReservationUnit.
        """
        pks: set[ReservationUnitPK] = {result.pk for result in reservation_units}
        results = (
            AffectingTimeSpan.objects.filter(affected_reservation_unit_ids__overlap=list(pks))
            .annotate(
                start_datetime=models.F("buffered_start_datetime") + models.F("buffer_time_before"),
                end_datetime=models.F("buffered_end_datetime") - models.F("buffer_time_after"),
                # Buffers are ignored for blocking reservation even if set.
                buffer_before=models.Case(
                    models.When(is_blocking=True, then=models.Value(datetime.timedelta(0))),
                    default=models.F("buffer_time_before"),
                    output_field=models.DurationField(),
                ),
                buffer_after=models.Case(
                    models.When(is_blocking=True, then=models.Value(datetime.timedelta(0))),
                    default=models.F("buffer_time_after"),
                    output_field=models.DurationField(),
                ),
            )
            .values(
                "affected_reservation_unit_ids",
                "start_datetime",
                "end_datetime",
                "buffer_before",
                "buffer_after",
                "is_blocking",
            )
        )

        closed = self.reservation_closed_time_spans_map
        blocking = self.blocking_reservation_closed_time_spans_map

        for result in results:
            time_span_element = TimeSpanElement(
                start_datetime=result["start_datetime"],
                end_datetime=result["end_datetime"],
                is_reservable=False,
                buffer_time_before=result["buffer_before"],
                buffer_time_after=result["buffer_after"],
            )
            time_spans_map = blocking if result["is_blocking"] else closed
            for pk in result["affected_reservation_unit_ids"]:
                if pk in pks:
                    time_spans_map.setdefault(pk, []).append(time_span_element)

        # Merge overlapping elements for each reservation unit to optimize FRT calculation
        for pk, timespans in closed.items():
            # Only merge what was added, not what is already in the dicts!
            if pk in pks:
                closed[pk] = merge_overlapping_time_span_elements(timespans)

        for pk, timespans in blocking.items():
            if pk in pks:
                blocking[pk] = merge_overlapping_time_span_elements(timespans)
