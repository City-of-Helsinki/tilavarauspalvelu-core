from collections.abc import Iterable
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Self

from django.db import models
from django.db.models import Case, Prefetch, Q, Value, When
from elasticsearch_django.models import SearchResultsQuerySet

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.date_utils import (
    as_local_timezone,
    combine,
    local_datetime,
    local_datetime_max,
    local_datetime_min,
    local_time_min,
)
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.reservable_time_span_client import TimeSpanElement, override_reservable_with_closed_time_spans

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit


ReservationUnitPK = int


def _get_hard_closed_time_spans_for_reservation_unit(reservation_unit: "ReservationUnit") -> list[TimeSpanElement]:
    reservation_unit_closed_time_spans: list[TimeSpanElement] = []

    if reservation_unit.reservation_begins:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=local_datetime_min(),
                end_datetime=reservation_unit.reservation_begins,
                is_reservable=False,
            )
        )
    if reservation_unit.reservation_ends:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=reservation_unit.reservation_ends,
                end_datetime=local_datetime_max(),
                is_reservable=False,
            )
        )

    if reservation_unit.publish_ends:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=reservation_unit.publish_ends,
                end_datetime=local_datetime_max(),
                is_reservable=False,
            )
        )

    # The `RESULTS_SENT` status ApplicationRounds already excluded in the queryset Prefetch
    for application_round in reservation_unit.application_rounds.all():
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=combine(application_round.reservation_period_begin, local_time_min()),
                end_datetime=combine(application_round.reservation_period_end, local_time_min()) + timedelta(days=1),
                is_reservable=False,
            )
        )

    return reservation_unit_closed_time_spans


def _get_soft_closed_time_spans_for_reservation_unit(reservation_unit: "ReservationUnit") -> list[TimeSpanElement]:
    now = local_datetime()
    reservation_unit_closed_time_spans: list[TimeSpanElement] = []

    if reservation_unit.reservations_min_days_before:
        # Minimum days before is calculated from the start of the day
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=local_datetime_min(),
                end_datetime=(
                    combine(now.date(), local_time_min())
                    + timedelta(days=reservation_unit.reservations_min_days_before)
                ),
                is_reservable=False,
            )
        )
    if reservation_unit.reservations_max_days_before:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=now + timedelta(days=reservation_unit.reservations_max_days_before),
                end_datetime=local_datetime_max(),
                is_reservable=False,
            )
        )

    return reservation_unit_closed_time_spans


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

        # Time inputs without timezone information are interpreted as local time
        if filter_time_start is not None:
            filter_time_start = as_local_timezone(
                filter_time_start,
                ref=datetime.combine(filter_date_start, filter_time_start),
            )
        if filter_time_end is not None:
            filter_time_end = as_local_timezone(
                filter_time_end,
                ref=datetime.combine(filter_date_end, filter_time_end),
            )

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

        ##################################
        # Initialise important variables #
        ##################################

        # Get ReservableTimeSpans for each ReservationUnit
        # When ReservableTimeSpans are accessed later, they are already filtered by date range
        reservation_units_with_annotated_time_spans: Iterable["ReservationUnit"]
        reservation_units_with_annotated_time_spans = self.exclude(
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

        reservation_closed_time_spans_map: dict[ReservationUnitPK, set[TimeSpanElement]]
        reservation_closed_time_spans_map = Reservation.objects.get_affecting_reservations_as_closed_time_spans(
            reservation_unit_queryset=self,
            start_date=filter_date_start,
            end_date=filter_date_end,
        )

        # Closed time spans that are shared by all ReservationUnits
        shared_closed_time_spans: list[TimeSpanElement] = [
            TimeSpanElement(
                start_datetime=local_datetime_min(),
                end_datetime=max(combine(filter_date_start, local_time_min()), now),
                is_reservable=False,
            ),
            TimeSpanElement(
                start_datetime=combine(filter_date_end, local_time_min()) + timedelta(days=1),
                end_datetime=local_datetime_max(),
                is_reservable=False,
            ),
        ]

        # Store values in a dict, so we can add them back to the original queryset later
        first_reservable_times: dict[ReservationUnitPK, datetime] = {}
        reservation_unit_closed_statuses: dict[ReservationUnitPK, bool] = {}

        ###########################
        # Do the important stuffs #
        ###########################

        # Loop through ReservationUnits and find the first reservable time and closed status span for each
        for reservation_unit in reservation_units_with_annotated_time_spans:
            reservation_unit_hard_closed_time_spans = _get_hard_closed_time_spans_for_reservation_unit(reservation_unit)
            reservation_unit_soft_closed_time_spans = _get_soft_closed_time_spans_for_reservation_unit(reservation_unit)

            for element in reservation_unit.origin_hauki_resource.reservable_time_spans.all():
                reservable_time_span = TimeSpanElement(
                    start_datetime=as_local_timezone(element.start_datetime),
                    end_datetime=as_local_timezone(element.end_datetime),
                    is_reservable=True,
                )

                # Closed time spans that cause the ReservationUnit to be shown as closed
                hard_closed_time_spans: list[TimeSpanElement] = (
                    shared_closed_time_spans
                    + reservation_unit_hard_closed_time_spans
                    + reservable_time_span.get_as_closed_time_spans(
                        filter_time_start=filter_time_start,
                        filter_time_end=filter_time_end,
                    )
                )

                # Remove closed time spans from the reservable time spans.
                # This will also split reservable time spans into multiple time spans if needed.
                # What is left is a list of time spans that are reservable and within the given filter parameters.
                hard_normalised_reservable_time_spans = override_reservable_with_closed_time_spans(
                    reservable_time_spans=[reservable_time_span],
                    closed_time_spans=hard_closed_time_spans,
                )

                # No reservable time spans left means the ReservationUnit is closed, continue to next ReservableTimeSpan
                if not hard_normalised_reservable_time_spans:
                    continue

                # ReservationUnit has a reservable time span on the filter date range, so it's not closed.
                reservation_unit_closed_statuses[reservation_unit.pk] = False

                # Validate `reservation_unit.max_reservation_duration`
                # Minimum requested duration is longer than the maximum allowed duration, skip this ReservationUnit
                if (
                    reservation_unit.max_reservation_duration is not None
                    and reservation_unit.max_reservation_duration < timedelta(minutes=minimum_duration_minutes)
                ):
                    break

                reservation_closed_time_spans = list(reservation_closed_time_spans_map.get(reservation_unit.pk, set()))

                # These time spans have no effect on the closed status of the ReservationUnit,
                # meaning that the ReservationUnit can be shown as open, even if there are no reservable time spans.
                soft_closed_time_spans = reservation_unit_soft_closed_time_spans + reservation_closed_time_spans

                soft_normalised_reservable_time_spans = override_reservable_with_closed_time_spans(
                    reservable_time_spans=hard_normalised_reservable_time_spans,
                    closed_time_spans=soft_closed_time_spans,
                )

                # Loop through the normalised time spans to find one that is long enough to fit the minimum duration
                for normalized_reservable_time_span in soft_normalised_reservable_time_spans:
                    # Move time span start time to the next valid start time
                    normalized_reservable_time_span.move_to_next_valid_start_time(reservation_unit)

                    # If the normalised time span is not long enough to fit the minimum duration, skip it.
                    if not normalized_reservable_time_span.can_fit_reservation_for_reservation_unit(
                        reservation_unit=reservation_unit,
                        minimum_duration_minutes=minimum_duration_minutes,
                    ):
                        continue

                    first_reservable_times[reservation_unit.pk] = normalized_reservable_time_span.start_datetime
                    break

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
