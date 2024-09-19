from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import F, Q
from django.utils.translation import gettext_lazy as _

from common.date_utils import DEFAULT_TIMEZONE
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement

from .queryset import ReservableTimeSpanManager

if TYPE_CHECKING:
    from .actions import ReservableTimeSpanActions


__all__ = [
    "ReservableTimeSpan",
]


class ReservableTimeSpan(models.Model):
    """A time period on which a ReservationUnit is reservable."""

    resource = models.ForeignKey(
        "tilavarauspalvelu.OriginHaukiResource",
        related_name="reservable_time_spans",
        on_delete=models.CASCADE,
    )
    start_datetime = models.DateTimeField(null=False, blank=False)
    end_datetime = models.DateTimeField(null=False, blank=False)

    objects = ReservableTimeSpanManager()

    class Meta:
        db_table = "reservable_time_span"
        base_manager_name = "objects"
        ordering = [
            "resource",
            "start_datetime",
            "end_datetime",
        ]
        constraints = [
            models.CheckConstraint(
                name="reservable_time_span_start_before_end",
                check=Q(start_datetime__lt=F("end_datetime")),
                violation_error_message=_("`start_datetime` must be before `end_datetime`."),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.resource} {self.get_datetime_str()}"

    @cached_property
    def actions(self) -> ReservableTimeSpanActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservableTimeSpanActions

        return ReservableTimeSpanActions(self)

    def get_datetime_str(self) -> str:
        strformat = "%Y-%m-%d %H:%M"

        start = self.start_datetime.astimezone(DEFAULT_TIMEZONE)
        end = self.end_datetime.astimezone(DEFAULT_TIMEZONE)

        if start.date() == end.date():
            return f"{start.strftime(strformat)}-{end.strftime('%H:%M')}"
        return f"{start.strftime(strformat)}-{end.strftime(strformat)}"

    def as_time_span_element(self) -> TimeSpanElement:
        return TimeSpanElement(
            start_datetime=self.start_datetime.astimezone(DEFAULT_TIMEZONE),
            end_datetime=self.end_datetime.astimezone(DEFAULT_TIMEZONE),
            is_reservable=True,
        )
