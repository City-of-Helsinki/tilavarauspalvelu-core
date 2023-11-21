from datetime import date, datetime, time, timedelta

from django.db import models
from django.db.models import Case, F, Q, QuerySet, Value, When
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _

DEFAULT_TIMEZONE = get_default_timezone()


class OriginHaukiResource(models.Model):
    # Resource id in Hauki API
    id = models.IntegerField(unique=True, primary_key=True)
    # Hauki API hash for opening hours, which is used to determine if the opening hours have changed
    opening_hours_hash = models.CharField(max_length=64, blank=True)
    # Latest date fetched from Hauki opening hours API
    latest_fetched_date = models.DateField(blank=True, null=True)

    def __str__(self) -> str:
        return str(self.id)

    def is_reservable(self, start_datetime: datetime, end_datetime: datetime) -> bool:
        return self.reservable_time_spans.filter_period(start=start_datetime, end=end_datetime).exists()


class ReservableTimeSpanQuerySet(models.QuerySet):
    def filter_period(self, start: datetime | date, end: datetime | date) -> QuerySet["ReservableTimeSpan"]:
        """Filter reservable time spans that overlap with the given period."""
        # Convert dates to datetimes to include timezone information
        if isinstance(start, date):
            start = datetime.combine(start, time.min, tzinfo=DEFAULT_TIMEZONE)
        if isinstance(end, date):
            end = datetime.combine(end, time.min, tzinfo=DEFAULT_TIMEZONE) + timedelta(days=1)

        return self.filter(start_datetime__lt=end, end_datetime__gt=start)

    def filter_date(self, selected_date: datetime | date) -> QuerySet["ReservableTimeSpan"]:
        """Filter reservable time spans that overlap with the given date."""
        return self.filter_period(start=selected_date, end=selected_date)

    def truncated_start_and_end_datetimes_for_period(self, start: date, end: date) -> QuerySet["ReservableTimeSpan"]:
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


class ReservableTimeSpan(models.Model):
    """A time period on which a ReservationUnit is reservable."""

    resource = models.ForeignKey(
        OriginHaukiResource,
        related_name="reservable_time_spans",
        on_delete=models.CASCADE,
    )
    start_datetime = models.DateTimeField(null=False, blank=False)
    end_datetime = models.DateTimeField(null=False, blank=False)

    objects = ReservableTimeSpanQuerySet.as_manager()

    class Meta:
        base_manager_name = "objects"
        ordering = ["resource", "start_datetime", "end_datetime"]
        constraints = [
            models.CheckConstraint(
                name="reservable_time_span_start_before_end",
                check=Q(start_datetime__lt=F("end_datetime")),
                violation_error_message=_("`start_datetime` must be before `end_datetime`."),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.resource} {self._get_datetime_str()}"

    def _get_datetime_str(self) -> str:
        strformat = "%Y-%m-%d %H:%M"

        start = self.start_datetime.astimezone(DEFAULT_TIMEZONE)
        end = self.end_datetime.astimezone(DEFAULT_TIMEZONE)

        if start.date() == end.date():
            return f"{start.strftime(strformat)}-{end.strftime('%H:%M')}"
        else:
            return f"{start.strftime(strformat)}-{end.strftime(strformat)}"
