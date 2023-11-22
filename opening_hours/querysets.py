from datetime import date, datetime, time, timedelta

from django.db import models
from django.db.models import Case, Q, Value, When
from django.utils.timezone import get_default_timezone

DEFAULT_TIMEZONE = get_default_timezone()


class ReservableTimeSpanQuerySet(models.QuerySet):
    def filter_period(self, start: datetime | date, end: datetime | date):
        """Filter reservable time spans that overlap with the given period."""
        # Convert dates to datetimes to include timezone information
        if isinstance(start, date):
            start = datetime.combine(start, time.min, tzinfo=DEFAULT_TIMEZONE)
        if isinstance(end, date):
            end = datetime.combine(end, time.min, tzinfo=DEFAULT_TIMEZONE) + timedelta(days=1)

        return self.filter(start_datetime__lt=end, end_datetime__gt=start)

    def filter_date(self, selected_date: datetime | date):
        """Filter reservable time spans that overlap with the given date."""
        return self.filter_period(start=selected_date, end=selected_date)

    def truncated_start_and_end_datetimes_for_period(self, start: date, end: date):
        """
        Annotate truncated start and end datetimes for reservable time spans that overlap with the given period.

        If the time span starts before the period, the start time is set to the period start.
        If the time span ends after the period, the end time is set to the period end.
        """
        start_datetime = datetime.combine(start, time.min, tzinfo=DEFAULT_TIMEZONE)
        end_datetime = datetime.combine(end, time.max, tzinfo=DEFAULT_TIMEZONE) + timedelta(days=1)
        return self.filter_period(start=start, end=end).annotate(
            truncated_start_datetime=Case(
                When(
                    condition=Q(start_datetime__lt=start_datetime),
                    then=Value(start_datetime),
                ),
                default="start_datetime",
            ),
            truncated_end_datetime=Case(
                When(
                    condition=Q(end_datetime__gt=end_datetime),
                    then=Value(end_datetime),
                ),
                default="end_datetime",
            ),
        )
