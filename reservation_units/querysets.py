from copy import copy
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from math import ceil
from typing import TYPE_CHECKING, Self

from django.db import models
from django.db.models import Case, Prefetch, Q, Value, When
from django.utils import timezone
from django.utils.timezone import get_default_timezone
from elasticsearch_django.models import SearchResultsQuerySet

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.reservable_time_span_client import TimeSpanElement, override_reservable_with_closed_time_spans

if TYPE_CHECKING:
    from opening_hours.models import ReservationUnit

DEFAULT_TIMEZONE = get_default_timezone()

INTERVAL_TO_MINUTES: dict[str, int] = {
    "interval_15_mins": 15,
    "interval_30_mins": 30,
    "interval_60_mins": 60,
    "interval_90_mins": 90,
}


def _get_hard_closed_time_spans_for_reservation_unit(reservation_unit: "ReservationUnit") -> list[TimeSpanElement]:
    reservation_unit_closed_time_spans: list[TimeSpanElement] = []

    if reservation_unit.reservation_begins:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=datetime.min.replace(tzinfo=DEFAULT_TIMEZONE),
                end_datetime=reservation_unit.reservation_begins,
                is_reservable=False,
            )
        )
    if reservation_unit.reservation_ends:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=reservation_unit.reservation_ends,
                end_datetime=datetime.max.replace(tzinfo=DEFAULT_TIMEZONE),
                is_reservable=False,
            )
        )

    if reservation_unit.publish_ends:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=reservation_unit.publish_ends,
                end_datetime=datetime.max.replace(tzinfo=DEFAULT_TIMEZONE),
                is_reservable=False,
            )
        )

    # The `RESULTS_SENT` status ApplicationRounds already excluded in the queryset Prefetch
    for application_round in reservation_unit.application_rounds.all():
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=datetime.combine(
                    application_round.reservation_period_begin, time.min, tzinfo=DEFAULT_TIMEZONE
                ),
                end_datetime=datetime.combine(
                    application_round.reservation_period_end, time.min, tzinfo=DEFAULT_TIMEZONE
                )
                + timedelta(days=1),
                is_reservable=False,
            )
        )

    return reservation_unit_closed_time_spans


def _get_soft_closed_time_spans_for_reservation_unit(reservation_unit: "ReservationUnit") -> list[TimeSpanElement]:
    now = timezone.localtime()
    reservation_unit_closed_time_spans: list[TimeSpanElement] = []

    if reservation_unit.reservations_min_days_before:
        # Minimum days before is calculated from the start of the day
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=datetime.min.replace(tzinfo=DEFAULT_TIMEZONE),
                end_datetime=datetime.combine(now.date(), time.min, tzinfo=DEFAULT_TIMEZONE)
                + timedelta(days=reservation_unit.reservations_min_days_before),
                is_reservable=False,
            )
        )
    if reservation_unit.reservations_max_days_before:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=now + timedelta(days=reservation_unit.reservations_max_days_before),
                end_datetime=datetime.max.replace(tzinfo=DEFAULT_TIMEZONE),
                is_reservable=False,
            )
        )

    return reservation_unit_closed_time_spans


def _get_closed_time_spans_for_time_span(
    time_span: TimeSpanElement,
    filter_time_start: time | None,
    filter_time_end: time | None,
) -> list[TimeSpanElement]:
    """
    Generate a list of closed time spans for a time span based on given filter time values.

    This list will contain at most two time spans for every day between the start and end date of this time span.
    """
    closed_time_spans: list[TimeSpanElement] = []

    if not filter_time_start and not filter_time_end:
        return closed_time_spans

    # Loop through every day between the start and end date of this time span
    for day in time_span.get_dates_range():
        # Add closed time spans for the time range outside of the given filter range
        # e.g. Filter time range is 10:00-14:00, add closed time spans for 00:00-10:00 and 14:00-00:00
        if filter_time_start and filter_time_start != time.min:
            closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=datetime.combine(day, time.min, tzinfo=DEFAULT_TIMEZONE),
                    end_datetime=datetime.combine(day, filter_time_start, tzinfo=DEFAULT_TIMEZONE),
                    is_reservable=False,
                )
            )
        if filter_time_end and filter_time_end != time.min:
            closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=datetime.combine(day, filter_time_end, tzinfo=DEFAULT_TIMEZONE),
                    end_datetime=datetime.combine(day, time.min, tzinfo=DEFAULT_TIMEZONE) + timedelta(days=1),
                    is_reservable=False,
                )
            )

    return closed_time_spans


def _get_next_valid_start_datetime(
    reservation_unit: "ReservationUnit",
    time_span: TimeSpanElement,
    filter_time_start: time | None,
    selected_start_datetime: datetime,
) -> datetime:
    """
    Get the next valid start time for a ReservationUnit.

    For a reservation to be valid, its start time must be at an interval that is valid for the ReservationUnit.
    e.g. When ReservationUnit.reservation_start_interval is 30 minutes,
    a reservation must start at 00:00, 00:30, 01:00, 01:30 from the start of the time span.
    """
    interval = INTERVAL_TO_MINUTES[reservation_unit.reservation_start_interval]

    if filter_time_start and selected_start_datetime.time() < filter_time_start:
        selected_start_datetime = datetime.combine(
            selected_start_datetime.date(), filter_time_start, tzinfo=DEFAULT_TIMEZONE
        )

    delta_minutes = (selected_start_datetime - time_span.start_datetime).total_seconds() / 60
    delta_to_next_interval = timedelta(minutes=interval) * ceil(delta_minutes / interval)
    return time_span.start_datetime + delta_to_next_interval


class ReservationUnitQuerySet(SearchResultsQuerySet):
    def scheduled_for_publishing(self):
        now = datetime.now(tz=DEFAULT_TIMEZONE)
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
        - Reservations from ReservationUnit's TILAHIERARKIA TODO
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
        - Reservations from ReservationUnit TILAHIERARKIA TODO
        """
        now = timezone.localtime()
        today = now.date()
        two_years_from_now = today + timedelta(days=731)  # 2 years + 1 day as a buffer

        #########################
        # Default filter values #
        #########################

        if filter_date_start is None:
            filter_date_start = today
        if filter_date_end is None:
            filter_date_end = two_years_from_now

        if filter_time_start is not None:
            filter_time_start = filter_time_start.replace(tzinfo=DEFAULT_TIMEZONE)
        if filter_time_end is not None:
            filter_time_end = filter_time_end.replace(tzinfo=DEFAULT_TIMEZONE)

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
        reservation_units_with_annotated_time_spans = self.exclude(
            origin_hauki_resource__isnull=True,
        ).prefetch_related(
            Prefetch(
                "origin_hauki_resource__reservable_time_spans",
                ReservableTimeSpan.objects.filter_period(
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

        # Closed time spans that are shared by all ReservationUnits
        shared_closed_time_spans: list[TimeSpanElement] = [
            TimeSpanElement(
                start_datetime=datetime.min.replace(tzinfo=DEFAULT_TIMEZONE),
                end_datetime=max(datetime.combine(filter_date_start, time.min, tzinfo=DEFAULT_TIMEZONE), now),
                is_reservable=False,
            ),
            TimeSpanElement(
                start_datetime=datetime.combine(filter_date_end, time.min, tzinfo=DEFAULT_TIMEZONE) + timedelta(days=1),
                end_datetime=datetime.max.replace(tzinfo=DEFAULT_TIMEZONE),
                is_reservable=False,
            ),
        ]

        # Store values in a dict, so we can add them back to the original queryset later
        ReservationUnitPK = int
        reservation_unit_to_first_reservable_time: dict[ReservationUnitPK, datetime] = {}
        reservation_unit_to_closed_status: dict[ReservationUnitPK, bool] = {}

        ###########################
        # Do the important stuffs #
        ###########################

        # Loop through ReservationUnits and find the first reservable time and closed status span for each
        for reservation_unit in reservation_units_with_annotated_time_spans:
            # Minimum duration of a reservation for this ReservationUnit
            reservation_unit_minimum_duration_minutes = (
                minimum_duration_minutes
                if not reservation_unit.min_reservation_duration
                else max(reservation_unit.min_reservation_duration.total_seconds() / 60, minimum_duration_minutes)
            )

            reservation_unit_hard_closed_time_spans = _get_hard_closed_time_spans_for_reservation_unit(reservation_unit)
            reservation_unit_soft_closed_time_spans = _get_soft_closed_time_spans_for_reservation_unit(reservation_unit)

            for reservable_time_span in reservation_unit.origin_hauki_resource.reservable_time_spans.all():
                time_span = TimeSpanElement(
                    start_datetime=reservable_time_span.start_datetime.astimezone(DEFAULT_TIMEZONE),
                    end_datetime=reservable_time_span.end_datetime.astimezone(DEFAULT_TIMEZONE),
                    is_reservable=True,
                )

                # Closed time spans that cause the ReservationUnit to be shown as closed
                hard_closed_time_spans: list[TimeSpanElement] = (
                    shared_closed_time_spans
                    + reservation_unit_hard_closed_time_spans
                    + _get_closed_time_spans_for_time_span(time_span, filter_time_start, filter_time_end)
                )

                # Remove closed time spans from the reservable time spans.
                # This will also split reservable time spans into multiple time spans if needed.
                # What is left is a list of time spans that are reservable and within the given filter parameters.
                hard_normalised_time_spans = override_reservable_with_closed_time_spans(
                    [copy(time_span)],  # Use copy() to avoid changes to the original time span in the function.
                    hard_closed_time_spans,
                )

                # No reservable time spans left means the ReservationUnit is closed, continue to next ReservableTimeSpan
                if not hard_normalised_time_spans:
                    continue

                # ReservationUnit has a reservable time span on the filter date range, so it's not closed.
                reservation_unit_to_closed_status[reservation_unit.pk] = False

                # Validate `reservation_unit.max_reservation_duration`
                # Minimum requested duration is longer than the maximum allowed duration, skip this ReservationUnit
                if (
                    reservation_unit.max_reservation_duration is not None
                    and reservation_unit.max_reservation_duration < timedelta(minutes=minimum_duration_minutes)
                ):
                    break

                # These time spans have no effect on the closed status of the ReservationUnit,
                # meaning that the ReservationUnit can be shown as open, even if there are no reservable time spans.
                soft_closed_time_spans = reservation_unit_soft_closed_time_spans

                # Apply more closed time spans to the normalised time spans to find the first reservable time span.
                soft_normalised_time_spans = override_reservable_with_closed_time_spans(
                    hard_normalised_time_spans, soft_closed_time_spans
                )

                # Loop through the normalised time spans to find one that is long enough to fit the minimum duration
                for ts in soft_normalised_time_spans:
                    # Move time span start time to the next valid start time
                    ts.start_datetime = _get_next_valid_start_datetime(
                        reservation_unit=reservation_unit,
                        time_span=time_span,
                        filter_time_start=filter_time_start,
                        selected_start_datetime=ts.start_datetime,
                    )

                    # If the normalised time span is not long enough to fit the minimum duration, skip it.
                    if ts.duration_minutes < reservation_unit_minimum_duration_minutes:
                        continue

                    reservation_unit_to_first_reservable_time[reservation_unit.pk] = ts.start_datetime
                    break

                # Suitable timespan was found, select and continue to next reservation unit
                if reservation_unit_to_first_reservable_time.get(reservation_unit.pk) is not None:
                    break

        ###################################
        # Annotate values to the queryset #
        ###################################

        # Create When statements for the queryset annotation
        first_reservable_time_whens: list[When] = [
            When(pk=pk, then=Value(start_datetime))
            for pk, start_datetime in reservation_unit_to_first_reservable_time.items()
        ]
        is_closed_whens: list[When] = [
            When(pk=pk, then=Value(is_closed)) for pk, is_closed in reservation_unit_to_closed_status.items()
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
