from collections.abc import Iterable
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Self, TypeAlias

from django.db import models
from django.db.models import Case, Prefetch, Q, Value, When
from elasticsearch_django.models import SearchResultsQuerySet

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.date_utils import local_datetime
from common.db import ArrayUnnest, SubqueryArray
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.reservable_time_span_client import override_reservable_with_closed_time_spans
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.utils.first_reservable_time import (
    find_first_reservable_time_span_for_reservation_unit,
    get_hard_closed_time_spans_for_reservation_unit,
    get_shared_hard_closed_time_spans,
    get_soft_closed_time_spans_for_reservation_unit,
)
from resources.models import Resource
from spaces.models import Space

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit


ReservationUnitPK: TypeAlias = int


class ReservationUnitQuerySet(SearchResultsQuerySet):
    def scheduled_for_publishing(self):
        now = local_datetime()
        return self.filter(
            Q(is_archived=False, is_draft=False)
            & (
                Q(publish_begins__isnull=False, publish_begins__gt=now)
                | Q(publish_ends__isnull=False, publish_ends__lte=now)
            )
        )

    def _prefetch_related_for_with_first_reservable_time(self, filter_date_start: date, filter_date_end: date) -> Self:
        """
        Prefetch ReservableTimeSpans and ApplicationRounds for each ReservationUnit and filter them by date range

        When the ReservableTimeSpans or ApplicationRounds are accessed later,
        they are already filtered by date range, so we don't need to query the database again.
        """
        return self.exclude(
            origin_hauki_resource__isnull=True,
        ).prefetch_related(
            Prefetch(
                "origin_hauki_resource__reservable_time_spans",
                ReservableTimeSpan.objects.overlapping_with_period(
                    start=filter_date_start,
                    end=filter_date_end,
                ).order_by("start_datetime"),
            ),
            Prefetch(
                "application_rounds",
                ApplicationRound.objects.with_round_status()
                .filter(
                    reservation_period_begin__lte=filter_date_end,
                    reservation_period_end__gte=filter_date_start,
                )
                .exclude(round_status=ApplicationRoundStatusChoice.RESULTS_SENT),
            ),
        )

    def with_first_reservable_time(
        self,
        filter_date_start: date | None,
        filter_date_end: date | None,
        filter_time_start: time | None,
        filter_time_end: time | None,
        minimum_duration_minutes: int | float | Decimal | None,
    ) -> Self:
        """
        Annotate the queryset with `first_reservable_datetime` and `is_closed` fields.

        Date and Time filters are used to filter a range of dates and time that the reservation must be within.

        This method works by first generating a list of closed time spans for each ReservationUnit and then one by one
        checking the reservable time spans for a time span that is not overlapping with closed time spans and still
        long enough to fulfill the minimum duration criteria.

        The list of closed time spans are generated from:
        - Given filter value
        - ReservationUnit settings
        - ReservationUnit's ApplicationRounds
        - Reservations from ReservationUnits with common hierarchy
        After removing the closed time spans, the first reservable time span that is long enough to fit the minimum
        duration is selected as the `first_reservable_datetime`.

        Variables which affect the first reservable time span and also can cause the ReservationUnit to be "closed"
        if no valid reservable times are found because of them:
        - Date filter range
        - Time filter range
        - ReservationUnit `reservation_begins`
        - ReservationUnit `reservation_ends`
        - ReservationUnit `publish_ends`
        - ApplicationRound `reservation_period_begin`
        - ApplicationRound `reservation_period_end`

        Variables which only affect the first reservable time span, but allow the ReservationUnit to be "open"
        if there would otherwise be valid time spans on the filtered date range:
        - Minimum duration filter
        - ReservationUnit `min_reservation_duration`
        - ReservationUnit `max_reservation_duration`
        - ReservationUnit `reservation_start_interval`
        - ReservationUnit `reservations_min_days_before`
        - ReservationUnit `reservations_max_days_before`
        - Reservations from ReservationUnits with common hierarchy
        - ReservationUnit `buffer_time_before` (when comparing with Reservations)
        - ReservationUnit `buffer_time_after` (when comparing with Reservations)
        """
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

        ##########################################
        # Get required objects from the database #
        ##########################################

        reservation_units_with_prefetched_related_objects: Iterable["ReservationUnit"]
        reservation_units_with_prefetched_related_objects = self._prefetch_related_for_with_first_reservable_time(
            filter_date_start=filter_date_start,
            filter_date_end=filter_date_end,
        )

        reservation_closed_time_spans_map: dict[ReservationUnitPK, set[TimeSpanElement]]
        reservation_closed_time_spans_map = Reservation.objects.get_affecting_reservations_as_closed_time_spans(
            reservation_unit_queryset=self.exclude(origin_hauki_resource__isnull=True),
            start_date=filter_date_start,
            end_date=filter_date_end,
        )

        ##################################
        # Initialise important variables #
        ##################################

        # Store values in a dict, so we can add them back to the original queryset later
        first_reservable_times: dict[ReservationUnitPK, datetime] = {}
        reservation_unit_closed_statuses: dict[ReservationUnitPK, bool] = {}

        # Closed time spans that are shared by all ReservationUnits
        shared_hard_closed_time_spans = get_shared_hard_closed_time_spans(filter_date_start, filter_date_end)

        ###########################
        # Do the important stuffs #
        ###########################

        # Loop through ReservationUnits and find the first reservable time and closed status span for each
        for reservation_unit in reservation_units_with_prefetched_related_objects:
            # Reservation Unit Hard Closed Time Spans
            #  Affect closed status
            #  Can overlap with buffers
            reservation_unit_hard_closed_time_spans: list[TimeSpanElement] = (
                get_hard_closed_time_spans_for_reservation_unit(reservation_unit)  # Formatting :)
                + shared_hard_closed_time_spans
            )

            # Reservation Unit Soft Closed Time Spans
            #  Don't affect closed status
            #  Can overlap with buffers
            reservation_unit_soft_closed_time_spans: list[TimeSpanElement] = (
                get_soft_closed_time_spans_for_reservation_unit(reservation_unit)  # Formatting :)
            )

            # Reservation Closed Time Spans
            #  Don't affect closed status
            #  Can't overlap with buffers
            reservation_unit_reservation_closed_time_spans: list[TimeSpanElement] = list(
                reservation_closed_time_spans_map.get(reservation_unit.pk, set())
            )

            # These time spans have no effect on the closed status of the ReservationUnit,
            # meaning that the ReservationUnit can be shown as open, even if there are no reservable time spans.
            soft_closed_time_spans = (
                reservation_unit_soft_closed_time_spans  # Formatting :)
                + reservation_unit_reservation_closed_time_spans
            )

            # Check if the ReservationUnits Maximum Reservation Duration is at least as long as the minimum duration.
            # However, we can't skip the ReservationUnit here yet because it might still be considered Open.
            is_reservation_unit_max_duration_invalid: bool = (
                reservation_unit.max_reservation_duration is not None
                and reservation_unit.max_reservation_duration < timedelta(minutes=minimum_duration_minutes)
            )

            # Go through each ReservableTimeSpan individually one-by-one
            for reservable_time_span in reservation_unit.origin_hauki_resource.reservable_time_spans.all():
                current_time_span = reservable_time_span.as_time_span_element()

                # Combine all Hard-Closed time spans into one list
                hard_closed_time_spans: list[TimeSpanElement] = (
                    reservation_unit_hard_closed_time_spans
                    + current_time_span.generate_closed_time_spans_outside_filter(
                        filter_time_start=filter_time_start,
                        filter_time_end=filter_time_end,
                    )
                )
                # Remove Hard-Closed time spans from the reservable time span.
                # What is left is a list of time spans that are reservable and within the given filter parameters.
                hard_normalised_reservable_time_spans: list[TimeSpanElement]
                hard_normalised_reservable_time_spans = override_reservable_with_closed_time_spans(
                    reservable_time_spans=[current_time_span],
                    closed_time_spans=hard_closed_time_spans,
                )

                # No reservable time spans left means the ReservationUnit is closed, continue to next ReservableTimeSpan
                if not hard_normalised_reservable_time_spans:
                    continue
                # ReservationUnit has a reservable time span on the filter date range, so it's marked as not closed.
                reservation_unit_closed_statuses[reservation_unit.pk] = False
                # Validate `reservation_unit.max_reservation_duration`
                if is_reservation_unit_max_duration_invalid:
                    break

                soft_normalised_reservable_time_spans = override_reservable_with_closed_time_spans(
                    reservable_time_spans=hard_normalised_reservable_time_spans,
                    closed_time_spans=soft_closed_time_spans,
                )

                first_reservable_times[reservation_unit.pk] = find_first_reservable_time_span_for_reservation_unit(
                    reservation_unit=reservation_unit,
                    normalised_reservable_time_spans=soft_normalised_reservable_time_spans,
                    reservations=reservation_unit_reservation_closed_time_spans,
                    minimum_duration_minutes=minimum_duration_minutes,
                )
                # Suitable timespan was found, select and continue to next reservation unit
                if first_reservable_times.get(reservation_unit.pk) is not None:
                    break

        ###################################
        # Annotate values to the queryset #
        ###################################

        # Create When statements for the queryset annotation
        first_reservable_time_whens: list[When] = [
            When(pk=pk, then=Value(start_datetime)) for pk, start_datetime in first_reservable_times.items()
        ]
        is_closed_whens: list[When] = [
            When(pk=pk, then=Value(is_closed)) for pk, is_closed in reservation_unit_closed_statuses.items()
        ]

        return self.annotate(
            first_reservable_datetime=Case(
                *first_reservable_time_whens,
                default=None,
                output_field=models.DateTimeField(),
            ),
            is_closed=Case(
                *is_closed_whens,
                default=True,
                output_field=models.BooleanField(),
            ),
        )

    def with_reservation_unit_ids_affecting_reservations(self) -> Self:
        """Annotate queryset with reservation ids for all reservation units that affect its reservations."""
        from reservation_units.models import ReservationUnit

        return self.alias(
            spaces_affecting_reservations=models.Subquery(
                queryset=(
                    Space.objects.filter(reservation_units__id=models.OuterRef("id"))
                    .with_family(include_self=True)
                    .annotate(all_families=ArrayUnnest("family"))
                    .values("all_families")
                ),
            ),
            resources_affecting_reservations=models.Subquery(
                queryset=Resource.objects.filter(reservation_units__id=models.OuterRef("id")).values("id"),
            ),
        ).annotate(
            reservation_units_affecting_reservations=SubqueryArray(
                queryset=(
                    ReservationUnit.objects.distinct()
                    .filter(
                        Q(spaces__in=models.OuterRef("spaces_affecting_reservations"))
                        | Q(resources__in=models.OuterRef("resources_affecting_reservations"))
                    )
                    .values("id")
                ),
                agg_field="id",
            ),
        )

    def reservation_units_with_common_hierarchy(self) -> Self:
        """
        Get a new queryset of reservation units that share a common hierarchy
        with any reservation unit in the original queryset.
        """
        from reservation_units.models import ReservationUnit

        return ReservationUnit.objects.alias(
            _ids=models.Subquery(
                queryset=(
                    self.with_reservation_unit_ids_affecting_reservations()
                    .annotate(_found_ids=ArrayUnnest("reservation_units_affecting_reservations"))
                    .values("_found_ids")
                )
            )
        ).filter(pk__in=models.F("_ids"))
