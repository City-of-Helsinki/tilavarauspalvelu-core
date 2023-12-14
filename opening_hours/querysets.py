from datetime import date, datetime, time, timedelta

from django.db.models import Case, Q, QuerySet, Value, When
from django.utils.timezone import get_default_timezone

DEFAULT_TIMEZONE = get_default_timezone()


def _normalize_datetime(value: date | datetime, timedelta_days: int = 0) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.combine(value, time.min, tzinfo=DEFAULT_TIMEZONE) + timedelta(days=timedelta_days)


class ReservableTimeSpanQuerySet(QuerySet):
    def filter_period(self, start: datetime | date, end: datetime | date):
        """Filter reservable time spans that overlap with the given period."""
        # Convert dates to datetimes to include timezone information
        start: datetime = _normalize_datetime(start)
        end: datetime = _normalize_datetime(end, timedelta_days=1)
        return self.filter(start_datetime__lt=end, end_datetime__gt=start)

    def filter_day(self, selected_date: datetime | date):
        """Filter reservable time spans that overlap with the given date."""
        return self.filter_period(start=selected_date, end=selected_date)

    def truncated_start_and_end_datetimes_for_period(self, start: datetime | date, end: datetime | date):
        """
        Annotate truncated start and end datetimes for reservable time spans that overlap with the given period.

        If the time span starts before the period, the start time is set to the period start.
        If the time span ends after the period, the end time is set to the period end (start of next day).
        """
        start = _normalize_datetime(start)
        end = _normalize_datetime(end, timedelta_days=1)
        return self.filter_period(
            start=start,
            end=end,
        ).annotate(
            truncated_start_datetime=Case(
                When(
                    condition=Q(start_datetime__lt=start),
                    then=Value(start),
                ),
                default="start_datetime",
            ),
            truncated_end_datetime=Case(
                When(
                    condition=Q(end_datetime__gt=end),
                    then=Value(end),
                ),
                default="end_datetime",
            ),
        )
