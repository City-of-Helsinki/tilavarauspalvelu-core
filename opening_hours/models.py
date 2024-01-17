from datetime import datetime, timedelta

from django.db import models
from django.db.models import F, Q
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _

from opening_hours.querysets import ReservableTimeSpanQuerySet
from opening_hours.utils.time_span_element import TimeSpanElement

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
        return self.reservable_time_spans.fully_fill_period(start=start_datetime, end=end_datetime).exists()


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

    def as_time_span_element(
        self,
        buffer_time_before: timedelta | None = None,
        buffer_time_after: timedelta | None = None,
    ) -> TimeSpanElement:
        return TimeSpanElement(
            start_datetime=self.start_datetime.astimezone(DEFAULT_TIMEZONE),
            end_datetime=self.end_datetime.astimezone(DEFAULT_TIMEZONE),
            buffer_time_before=buffer_time_before,
            buffer_time_after=buffer_time_after,
            is_reservable=True,
        )
