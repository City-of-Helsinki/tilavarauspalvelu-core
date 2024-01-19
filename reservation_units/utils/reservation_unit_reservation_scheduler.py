from datetime import date, datetime, time, timedelta

from django.db.models import QuerySet
from django.utils.timezone import get_default_timezone

from opening_hours.models import ReservableTimeSpan
from reservation_units.models import ReservationUnit

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationUnitReservationScheduler:
    reservation_unit: ReservationUnit

    reservation_period_start_date: date
    reservation_period_end_date: date

    def __init__(self, reservation_unit: ReservationUnit, opening_hours_end: date | None = None):
        self.reservation_unit = reservation_unit

        # Init the period for which reservations can be made
        self.reservation_period_start_date = self._get_reservation_period_start_date()
        self.reservation_period_end_date = self._get_reservation_period_end_date()

        if opening_hours_end and opening_hours_end >= self.reservation_period_start_date:
            self.reservation_period_end_date = opening_hours_end

    def _get_reservation_period_start_date(self) -> date | None:
        """Get the minimum date for which reservations can be made"""
        # By default, the start date is now
        start_date = datetime.now(tz=DEFAULT_TIMEZONE)

        # If reservation_min_days_before is set, start date must be at least that many days from now
        if self.reservation_unit.reservations_min_days_before:
            delta = self.reservation_unit.reservations_min_days_before
            start_date = start_date + timedelta(days=delta)

        # If reservation_begins is set, use it as the start date instead
        if self.reservation_unit.reservation_begins and self.reservation_unit.reservation_begins > start_date:
            start_date = self.reservation_unit.reservation_begins

        return start_date.astimezone(DEFAULT_TIMEZONE).date()

    def _get_reservation_period_end_date(self) -> date | None:
        """Get the maximum date for which reservations can be made"""
        end_date = datetime.max

        # If reservation_ends is set, use that as the end date
        if self.reservation_unit.reservation_ends:
            end_date = self.reservation_unit.reservation_ends

        # If reservation_max_days_before is set, limit the end date to be at most that many days from now
        if self.reservation_unit.reservations_max_days_before:
            delta = self.reservation_unit.reservations_max_days_before
            return (datetime.now(tz=DEFAULT_TIMEZONE) + timedelta(days=delta)).astimezone(DEFAULT_TIMEZONE).date()

        if end_date != datetime.max:
            return end_date.astimezone(DEFAULT_TIMEZONE).date()

        # No limit on the end date
        return None

    def get_conflicting_open_application_round(self, start: date, end: date):
        from applications.models import ApplicationRound

        for app_round in ApplicationRound.objects.filter(
            reservation_units=self.reservation_unit,
            reservation_period_end__gte=end,
            reservation_period_begin__lte=start,
        ):
            if app_round.status.is_ongoing:
                return app_round

        return None

    def is_reservation_unit_open(self, start_datetime: datetime, end_datetime: datetime) -> bool:
        origin_hauki_resource = self.reservation_unit.origin_hauki_resource
        if not origin_hauki_resource:
            return False

        return origin_hauki_resource.is_reservable(start_datetime, end_datetime)

    def get_reservation_unit_possible_start_times(self, selected_date: date, interval_minutes: int) -> set[datetime]:
        resource = self.reservation_unit.origin_hauki_resource
        reservable_time_spans: QuerySet[ReservableTimeSpan] = resource.reservable_time_spans.filter(
            start_datetime__date__lte=selected_date,
            end_datetime__date__gte=selected_date,
        )

        possible_start_times = set()
        start_time = datetime.combine(selected_date, time.min, tzinfo=DEFAULT_TIMEZONE)
        interval_timedelta = timedelta(minutes=interval_minutes)

        for time_span in reservable_time_spans:
            # If the time span starts on the previous day, start from the beginning of selected date instead.
            # Also handles cases where the time spans have a break smaller than the interval.
            start_time = max(time_span.start_datetime, start_time).astimezone(DEFAULT_TIMEZONE)

            # Get all possible start times by looping through the time span until the time span or day ends
            while start_time < time_span.end_datetime and start_time.date() == selected_date:
                possible_start_times.add(start_time)
                start_time += interval_timedelta
        return possible_start_times
