from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import TYPE_CHECKING

from django.db import models
from lookup_property import L
from query_optimizer.utils import calculate_queryset_slice

from applications.enums import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.date_utils import local_datetime, local_datetime_max, local_datetime_min, local_start_of_day
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.utils.first_reservable_time_helper.first_reservable_time_reservation_unit_helper import (
    ReservationUnitFirstReservableTimeHelper,
)

if TYPE_CHECKING:
    from decimal import Decimal

    from django.db.models import QuerySet, When
    from query_optimizer.validators import PaginationArgs

    from reservation_units.models import ReservationUnit
    from reservation_units.querysets import ReservationUnitQuerySet

type ReservationUnitPK = int


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
    filter_date_start: date
    filter_date_end: date
    filter_time_start: time | None
    filter_time_end: time | None
    filter_minimum_duration_minutes: int

    # QuerySet passed to the helper
    original_reservation_unit_queryset: ReservationUnitQuerySet
    # ReservationUnits with prefetched ReservableTimeSpans and ApplicationRounds
    optimized_reservation_unit_queryset: ReservationUnitQuerySet
    # Contains a set of closed time spans for each ReservationUnit generated from their relevant Reservations
    reservation_closed_time_spans_map: dict[ReservationUnitPK, set[TimeSpanElement]]
    # Contains a set of closed time spans for each ReservationUnit generated from their relevant BLOCKING Reservations
    blocking_reservation_closed_time_spans_map: dict[ReservationUnitPK, set[TimeSpanElement]]

    # Contains a list of the first reservable time for each ReservationUnit.
    first_reservable_times: dict[ReservationUnitPK, datetime]
    # Contains a list of the closed status for each ReservationUnit.
    reservation_unit_closed_statuses: dict[ReservationUnitPK, bool]
    # Contains a list of hard closed time spans that are shared by all ReservationUnits.
    shared_hard_closed_time_spans: list[TimeSpanElement]

    def __init__(
        self,
        reservation_unit_queryset: ReservationUnitQuerySet,
        filter_date_start: date | None = None,
        filter_date_end: date | None = None,
        filter_time_start: time | None = None,
        filter_time_end: time | None = None,
        minimum_duration_minutes: float | Decimal | None = None,
        show_only_reservable: bool = False,
        pagination_args: PaginationArgs | None = None,
    ) -> None:
        now = local_datetime()
        today = now.date()
        two_years_from_now = today + timedelta(days=731)  # 2 years + 1 day as a buffer

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
        self.pagination_args = pagination_args

        ##########################################
        # Get required objects from the database #
        ##########################################

        self.original_reservation_unit_queryset = reservation_unit_queryset
        self.optimized_reservation_unit_queryset = self._get_reservation_unit_queryset_for_calculation()

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

        chuck_size: int = qs.count()
        if self.pagination_args is not None:
            self.pagination_args["size"] = chuck_size
            qs_slice = calculate_queryset_slice(**self.pagination_args)
            chuck_size = qs_slice.stop - qs_slice.start
            qs = qs[qs_slice.start :]

        page_size: int = 0
        for reservation_unit in qs.iterator(chunk_size=chuck_size):
            helper = ReservationUnitFirstReservableTimeHelper(parent=self, reservation_unit=reservation_unit)
            is_closed, first_reservable_time = helper.calculate_first_reservable_time()

            self.reservation_unit_closed_statuses[reservation_unit.pk] = is_closed
            self.first_reservable_times[reservation_unit.pk] = first_reservable_time

            # If we have pagination args, we can stop if we have enough reservation units to fill the page size.
            # If 'show_only_reservable' is True, we might need to fetch more than the first chunk size.
            if self.pagination_args is not None:
                if not self.show_only_reservable or not is_closed:
                    page_size += 1

                if page_size >= chuck_size:
                    break

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
            # ReservationUnits are not reservable without a HaukiResource
            .exclude(origin_hauki_resource__isnull=True)
            # Annotate affecting reservations as timespans
            .with_affecting_time_spans(start=self.filter_date_start, end=self.filter_date_end)
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
                start_datetime=local_start_of_day(self.filter_date_end) + timedelta(days=1),
                end_datetime=local_datetime_max(),
                is_reservable=False,
            ),
        ]
