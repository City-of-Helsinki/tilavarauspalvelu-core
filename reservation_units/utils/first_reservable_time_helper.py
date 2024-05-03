from __future__ import annotations

import math
from collections.abc import Iterable
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, NamedTuple

from django.db import models
from django.db.models import QuerySet, When
from lookup_property import L

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.date_utils import local_datetime, local_datetime_max, local_datetime_min, local_start_of_day
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.reservable_time_span_client import override_reservable_with_closed_time_spans
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.enums import ReservationStartInterval

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit
    from reservation_units.querysets import ReservationUnitQuerySet

type ReservationUnitPK = int


class ReservableTimeOutput(NamedTuple):
    is_closed: bool
    first_reservable_time: datetime | None


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
    minimum_duration_minutes: int

    # QuerySet passed to the helper
    reservation_unit_queryset: ReservationUnitQuerySet
    # ReservationUnits with prefetched ReservableTimeSpans and ApplicationRounds
    reservation_units_with_prefetched_related_objects: Iterable[ReservationUnit]
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
    ):
        from reservations.models import Reservation

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
        elif filter_date_end < today:
            raise ValueError("'reservable_date_end' must be not be in the past.")
        elif filter_date_end > two_years_from_now:
            raise ValueError("'reservable_date_end' must be not be more than two years in the future.")
        elif filter_date_start > filter_date_end:
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

        ##########################################
        # Get required objects from the database #
        ##########################################

        self.reservation_unit_queryset = reservation_unit_queryset
        self.reservation_units_with_prefetched_related_objects = self._get_reservation_unit_queryset_with_prefetches()

        reservations, blocking_reservations = Reservation.objects.get_affecting_reservations_as_closed_time_spans(
            reservation_unit_queryset=reservation_unit_queryset.exclude(origin_hauki_resource__isnull=True),
            start_date=filter_date_start,
            end_date=filter_date_end,
        )
        self.reservation_closed_time_spans_map = reservations
        self.blocking_reservation_closed_time_spans_map = blocking_reservations
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
        for reservation_unit in self.reservation_units_with_prefetched_related_objects:
            helper = ReservationUnitFirstReservableTimeHelper(parent=self, reservation_unit=reservation_unit)
            is_closed, first_reservable_time = helper.calculate_first_reservable_time()

            self.reservation_unit_closed_statuses[reservation_unit.pk] = is_closed
            self.first_reservable_times[reservation_unit.pk] = first_reservable_time

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

        return self.reservation_unit_queryset.annotate(
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

    def _get_reservation_unit_queryset_with_prefetches(self) -> ReservationUnitQuerySet:
        """
        Prefetch ReservableTimeSpans and ApplicationRounds for each ReservationUnit and filter them by date range

        When `reservation_unit.origin_hauki_resource.reservable_time_spans` or `reservation_unit.application_rounds`
        are accessed later, they are already filtered by date range, so we don't need to query the database again.
        """
        return self.reservation_unit_queryset.exclude(
            origin_hauki_resource__isnull=True,
        ).prefetch_related(
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


class ReservationUnitFirstReservableTimeHelper:
    """
    Helper class for finding the first reservable time for a ReservationUnit.

    This helper is meant to be used only together with the `FirstReservableTimeHelper` class.
    """

    parent: FirstReservableTimeHelper
    reservation_unit: ReservationUnit

    # Hard Closed Time Spans
    # [x] Affects closed status
    # [x] Can overlap with buffers
    hard_closed_time_spans: list[TimeSpanElement]

    # Soft Closed Time Spans
    # [ ] Affects closed status
    # [x] Can overlap with buffers
    soft_closed_time_spans: list[TimeSpanElement]

    # BLOCKED-type Reservation Closed Time Spans
    # [ ] Affects closed status
    # [X] Can overlap with buffers
    blocking_reservation_closed_time_spans: list[TimeSpanElement]

    # Reservation Closed Time Spans
    # [ ] Affects closed status
    # [ ] Can overlap with buffers
    reservation_closed_time_spans: list[TimeSpanElement]

    # Minimum duration in minutes for the ReservationUnit
    minimum_duration_minutes: int

    is_reservation_unit_max_duration_invalid: bool

    def __init__(self, parent: FirstReservableTimeHelper, reservation_unit: ReservationUnit):
        self.parent = parent
        self.reservation_unit = reservation_unit

        self.hard_closed_time_spans = self._get_hard_closed_time_spans()
        self.hard_closed_time_spans += parent.shared_hard_closed_time_spans

        self.reservation_closed_time_spans = self._get_reservation_closed_time_spans()
        self.blocking_reservation_closed_time_spans = self._get_blocking_reservation_closed_time_spans()

        self.soft_closed_time_spans = self._get_soft_closed_time_spans()
        self.soft_closed_time_spans += self.reservation_closed_time_spans
        self.soft_closed_time_spans += self.blocking_reservation_closed_time_spans

        start_interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        self.minimum_duration_minutes = max(
            parent.filter_minimum_duration_minutes,
            int((reservation_unit.min_reservation_duration or timedelta()).total_seconds() / 60),
            start_interval_minutes,  # Minimum duration must be at least as long as the start interval
        )

        if reservation_unit.max_reservation_duration is None:
            self.is_reservation_unit_max_duration_invalid = False
        else:
            maximum_duration_minutes = reservation_unit.max_reservation_duration.total_seconds() / 60
            # Ensure that the maximum duration is a multiple of the start interval
            if maximum_duration_minutes % start_interval_minutes != 0:
                maximum_duration_minutes -= maximum_duration_minutes % start_interval_minutes
            # Check if the ReservationUnits Maximum Reservation Duration is at least as long as the minimum duration.
            # Note that we still need to check if the ReservationUnit is considered Open, so we can't return early here.
            self.is_reservation_unit_max_duration_invalid = maximum_duration_minutes < self.minimum_duration_minutes

    def calculate_first_reservable_time(self) -> ReservableTimeOutput:
        is_closed = True

        # Go through each ReservableTimeSpan individually one-by-one until a suitable time span is found.
        for reservable_time_span in self.reservation_unit.origin_hauki_resource.reservable_time_spans.all():
            helper = ReservableTimeSpanFirstReservableTimeHelper(parent=self, reservable_time_span=reservable_time_span)
            output = helper.calculate_first_reservable_time()

            # The ReservationUnit is not closed. Save the value in case we don't find a first reservable time.
            if output.is_closed is False:
                is_closed = False

            # If we have found a first reservable time, we can return early
            if output.first_reservable_time is not None:
                return output

        return ReservableTimeOutput(is_closed=is_closed, first_reservable_time=None)

    def _get_hard_closed_time_spans(self) -> list[TimeSpanElement]:
        """
        Get a list of closed time spans that cause the ReservationUnit to be shown as closed

        Returned list of closed TimeSpanElements is built using:
        - reservation_unit.reservation_begins
        - reservation_unit.reservation_ends
        - reservation_unit.publish_ends
        - reservation_unit.application_rounds.reservation_period_begin
        - reservation_unit.application_rounds.reservation_period_end
        """
        reservation_unit_closed_time_spans: list[TimeSpanElement] = []

        if self.reservation_unit.reservation_begins:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=local_datetime_min(),
                    end_datetime=self.reservation_unit.reservation_begins,
                    is_reservable=False,
                )
            )
        if self.reservation_unit.reservation_ends:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=self.reservation_unit.reservation_ends,
                    end_datetime=local_datetime_max(),
                    is_reservable=False,
                )
            )

        if self.reservation_unit.publish_ends:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=self.reservation_unit.publish_ends,
                    end_datetime=local_datetime_max(),
                    is_reservable=False,
                )
            )

        # The `RESULTS_SENT` status ApplicationRounds already excluded when `application_rounds` are prefetched,
        # so we don't need to filter those away here.
        reservation_unit_closed_time_spans.extend(
            TimeSpanElement(
                start_datetime=local_start_of_day(application_round.reservation_period_begin),
                end_datetime=local_start_of_day(application_round.reservation_period_end) + timedelta(days=1),
                is_reservable=False,
            )
            for application_round in self.reservation_unit.application_rounds.all()
        )

        return reservation_unit_closed_time_spans

    def _get_soft_closed_time_spans(self) -> list[TimeSpanElement]:
        """
        Get a list of closed time spans that have no effect on the closed status of the ReservationUnit

        Returned list of closed TimeSpanElements is built using:
        - reservation_unit.reservations_min_days_before
        - reservation_unit.reservations_max_days_before
        """
        now = local_datetime()
        reservation_unit_closed_time_spans: list[TimeSpanElement] = []

        if self.reservation_unit.reservations_min_days_before:
            # Minimum days before is calculated from the start of the day
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=local_datetime_min(),
                    end_datetime=(
                        local_start_of_day(now) + timedelta(days=self.reservation_unit.reservations_min_days_before)
                    ),
                    is_reservable=False,
                )
            )
        if self.reservation_unit.reservations_max_days_before:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=now + timedelta(days=self.reservation_unit.reservations_max_days_before),
                    end_datetime=local_datetime_max(),
                    is_reservable=False,
                )
            )

        return reservation_unit_closed_time_spans

    def _get_reservation_closed_time_spans(self) -> list[TimeSpanElement]:
        """Get a list of closed time spans from Reservations of the ReservationUnit"""
        return list(self.parent.reservation_closed_time_spans_map.get(self.reservation_unit.pk, set()))

    def _get_blocking_reservation_closed_time_spans(self) -> list[TimeSpanElement]:
        """Get a list of closed time spans from Reservations of the ReservationUnit"""
        return list(self.parent.blocking_reservation_closed_time_spans_map.get(self.reservation_unit.pk, set()))


class ReservableTimeSpanFirstReservableTimeHelper:
    """
    Helper class for finding the first reservable time for a ReservationUnit in a single ReservableTimeSpan.

    This helper is meant to be used only together with the `ReservationUnitFirstReservableTimeHelper` class.
    """

    parent: ReservationUnitFirstReservableTimeHelper
    reservable_time_span: ReservableTimeSpan

    def __init__(self, parent: ReservationUnitFirstReservableTimeHelper, reservable_time_span: ReservableTimeSpan):
        self.parent = parent
        self.reservable_time_span = reservable_time_span

    def calculate_first_reservable_time(self) -> ReservableTimeOutput:
        current_time_span: TimeSpanElement = self.reservable_time_span.as_time_span_element()

        normalised_time_spans: list[TimeSpanElement] = self._hard_normalise_time_span(current_time_span)

        # If there are no reservable time spans left, the ReservationUnit is closed during this time span.
        if not normalised_time_spans:
            return ReservableTimeOutput(is_closed=True, first_reservable_time=None)

        # At this point we know that the ReservationUnit is OPEN.
        # Now that we know if the ReservationUnit is OPEN, Validate `reservation_unit.max_reservation_duration`.
        if self.parent.is_reservation_unit_max_duration_invalid:
            return ReservableTimeOutput(is_closed=False, first_reservable_time=None)

        normalised_time_spans = self._soft_normalise_time_span(normalised_time_spans)
        if not normalised_time_spans:
            return ReservableTimeOutput(is_closed=False, first_reservable_time=None)

        # At this point we have removed all the closed time spans from the reservable time span.
        # Finally, try to find the first reservable time span from the left over reservable time spans.
        first_reservable_time: datetime | None = self._find_first_reservable_time_span(
            normalised_reservable_time_spans=normalised_time_spans,
            reservation_time_spans=self.parent.reservation_closed_time_spans,
        )

        return ReservableTimeOutput(is_closed=False, first_reservable_time=first_reservable_time)

    def _hard_normalise_time_span(self, current_time_span: TimeSpanElement) -> list[TimeSpanElement]:
        """Remove Hard-Closed time spans from a TimeSpanElement."""
        combined_hard_closed_time_spans: list[TimeSpanElement] = []

        # Add hard closed time spans from the ReservationUnit
        combined_hard_closed_time_spans += self.parent.hard_closed_time_spans
        # Add hard closed time spans from the ReservableTimeSpan
        combined_hard_closed_time_spans += current_time_span.generate_closed_time_spans_outside_filter(
            filter_time_start=self.parent.parent.filter_time_start,
            filter_time_end=self.parent.parent.filter_time_end,
        )

        return override_reservable_with_closed_time_spans(
            reservable_time_spans=[current_time_span],
            closed_time_spans=combined_hard_closed_time_spans,
        )

    def _soft_normalise_time_span(self, hard_normalised_time_spans: list[TimeSpanElement]) -> list[TimeSpanElement]:
        """Remove Soft-Closed time spans from the reservable time span."""
        return override_reservable_with_closed_time_spans(
            reservable_time_spans=hard_normalised_time_spans,
            closed_time_spans=self.parent.soft_closed_time_spans,
        )

    def _find_first_reservable_time_span(
        self,
        normalised_reservable_time_spans: list[TimeSpanElement],
        reservation_time_spans: list[TimeSpanElement],
    ) -> datetime | None:
        """
        Find the first reservable time span for the ReservationUnit.

        Due to earlier normalisation, we know that `normalised_reservable_time_spans` (without buffers) and
        `reservation_time_spans` (with buffers) can never overlap.

        However, because the `normalised_reservable_time_spans` (with buffers from reservation_unit) and
        `reservation_time_spans` (without buffers) can overlap, so we need to process
        the `normalised_reservable_time_spans` one-by-one and check if they overlap with `reservation_time_spans`.

        If they do overlap, we need to shorten the `reservable_time_span` so that its buffer doesn't overlap with
        the `reservation`, while leaving the buffer size unchanged.

        After processing, we can check if the reservable_time_span is still long enough to fit the minimum duration.
        """
        reservation_unit = self.parent.reservation_unit
        minimum_duration_minutes = self.parent.minimum_duration_minutes

        for reservable_time_span in normalised_reservable_time_spans:
            if reservable_time_span is None:
                continue

            # The reservable time span inherits the buffer times from the ReservationUnit
            reservable_time_span.buffer_time_before = reservation_unit.buffer_time_before
            reservable_time_span.buffer_time_after = reservation_unit.buffer_time_after

            for reservation in reservation_time_spans:
                # Reservation (with buffers) can not overlap with the reservable time span (without buffers).
                if reservable_time_span.overlaps_with(reservation):
                    raise ValueError("Reservable Time Span overlaps with Reservation buffer. This should never happen.")

                # Only continue forward if a buffered time span overlaps with a reservation (without buffers)
                if not reservation.overlaps_with(reservable_time_span):
                    continue  # No overlapping, skip

                # Reservation is inside the Before-buffer, shorten the reservable time span from the start
                # ┌────────────────────────────────────────────────────────────────┐
                # │ █ = Existing Reservation                                       │
                # │ ▁ = Reservable Time Span                                       │
                # │ ▄ = Reservable Time Span Buffer                                │
                # ├──────────────────────────┬─────────────────────────────────────┤
                # │ ▄▄▄▄▁▁▁▁▁▁ ->     ▄▄▄▄▁▁ │ Reservation starts in Before-buffer │
                # │ ████       -> ████       │                                     │
                # ├──────────────────────────┼─────────────────────────────────────┤
                # │     ▄▄▁▁▁▁ ->       ▄▄▁▁ │ Reservation ends in Before-buffer   │
                # │   ████     ->   ████     │                                     │
                # └──────────────────────────┴─────────────────────────────────────┘
                elif (
                    reservable_time_span.buffered_start_datetime
                    <= reservation.end_datetime
                    <= reservable_time_span.start_datetime
                ):
                    overlap = reservation.end_datetime - reservable_time_span.buffered_start_datetime
                    reservable_time_span.start_datetime += overlap

                # Reservation is inside the After-buffer, shorten the reservable time span from the end
                # ┌──────────────────────────┬─────────────────────────────────────┐
                # │ ▁▁▁▁▄▄▄▄   -> ▁▁▄▄▄▄     │ Reservation starts in After-buffer  │
                # │       ████ ->       ████ │                                     │
                # ├──────────────────────────┼─────────────────────────────────────┤
                # │ ▁▁▁▁▁▁▄▄▄▄ -> ▁▁▄▄▄▄     │ Reservation ends in After-buffer    │
                # │       ████ ->       ████ │                                     │
                # └──────────────────────────┴─────────────────────────────────────┘
                elif (
                    reservable_time_span.end_datetime
                    <= reservation.start_datetime
                    <= reservable_time_span.buffered_end_datetime
                ):
                    overlap = reservable_time_span.buffered_end_datetime - reservation.start_datetime
                    reservable_time_span.end_datetime -= overlap

                # Reservable Time Span is now shorter than the minimum duration, so we can't use it.
                if reservable_time_span.duration_minutes < minimum_duration_minutes:
                    break

            # In case of an invalid start time due to normalisation, move to the next valid start time
            self._move_time_span_to_next_valid_start_time(reservable_time_span)

            if self._can_reservation_fit_inside_time_span(reservable_time_span):
                return reservable_time_span.start_datetime

        return None

    def _move_time_span_to_next_valid_start_time(self, time_span: TimeSpanElement) -> None:
        """
        Move the given reservable time spans start time to the next valid start time based on the
        given reservation unit's settings and filter time start.

        ---

        For the start time to be valid, it must be at an interval that is valid for the ReservationUnit starting
        from the beginning of the ReservableTimeSpan.

        Examples:
        1.
          - ReservationUnit.reservation_start_interval is 30 minutes.
          - ReservableTimeSpan.start_datetime is 10:00.
          - A new reservation must start at 10:00, 10:30, 11:00, 11:30 etc.
        2.
          - ReservationUnit.reservation_start_interval is 90 minutes.
          - ReservableTimeSpan.start_datetime is 11:15.
          - A new reservation must start at 11:15, 12:45, 14:15, 15:45 etc.
        """
        reservation_unit = self.parent.reservation_unit
        interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        time_span.round_start_time_to_next_minute()

        difference: timedelta = time_span.start_datetime - self.reservable_time_span.start_datetime
        difference_minutes = difference.total_seconds() / 60

        minutes_past_interval = math.ceil(difference_minutes % interval_minutes)
        if minutes_past_interval == 0:
            return

        # Move the start time to the next valid interval by adding the difference between
        # interval_minutes and minutes_past_interval to the start time.
        # e.g. interval=30, overflow_minutes=15, start_time += (30-15 = 15) minutes
        minutes_to_next_interval = timedelta(minutes=interval_minutes - minutes_past_interval)
        time_span.start_datetime += minutes_to_next_interval

    def _can_reservation_fit_inside_time_span(self, time_span: TimeSpanElement) -> bool:
        """
        Can the given TimeSpanElement fit a reservation for the ReservationUnit?

        We need to validate front, back and total duration separately because the buffers can be of different lengths.
        """
        reservation_unit = self.parent.reservation_unit
        minimum_duration_minutes = self.parent.minimum_duration_minutes

        # If this time span's duration is less than the minimum duration, it obviously can't fit.
        if time_span.duration_minutes < minimum_duration_minutes:
            return False

        # Validate duration with front buffers
        buffer_front_minutes = 0
        if reservation_unit.buffer_time_before:
            buffer_front_minutes = reservation_unit.buffer_time_before.total_seconds() / 60
            if time_span.front_buffered_duration_minutes < (buffer_front_minutes + minimum_duration_minutes):
                return False

        # Validate duration with back buffers
        buffer_back_minutes = 0
        if reservation_unit.buffer_time_after:
            buffer_back_minutes = reservation_unit.buffer_time_after.total_seconds() / 60
            if time_span.back_buffered_duration_minutes < (minimum_duration_minutes + buffer_back_minutes):
                return False

        # Validate duration with front and back buffers together
        buffered_minimum_duration_minutes = minimum_duration_minutes + buffer_front_minutes + buffer_back_minutes
        return buffered_minimum_duration_minutes <= time_span.buffered_duration_minutes
