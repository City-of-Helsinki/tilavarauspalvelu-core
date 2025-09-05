from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
from utils.date_utils import DEFAULT_TIMEZONE

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import OriginHaukiResource

    from .actions import ReservableTimeSpanActions
    from .queryset import ReservableTimeSpanManager
    from .validators import ReservableTimeSpanValidator


__all__ = [
    "ReservableTimeSpan",
]


class ReservableTimeSpan(models.Model):
    """A time period on which a ReservationUnit is reservable."""

    resource: OriginHaukiResource = models.ForeignKey(
        "tilavarauspalvelu.OriginHaukiResource",
        related_name="reservable_time_spans",
        on_delete=models.CASCADE,
    )
    start_datetime: datetime.datetime = models.DateTimeField(null=False, blank=False)
    end_datetime: datetime.datetime = models.DateTimeField(null=False, blank=False)

    objects: ClassVar[ReservableTimeSpanManager] = LazyModelManager.new()
    actions: ReservableTimeSpanActions = LazyModelAttribute.new()
    validators: ReservableTimeSpanValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservable_time_span"
        base_manager_name = "objects"
        verbose_name = _("request log")
        verbose_name_plural = _("request logs")
        ordering = [
            "resource",
            "start_datetime",
            "end_datetime",
        ]
        constraints = [
            models.CheckConstraint(
                name="reservable_time_span_start_before_end",
                check=models.Q(start_datetime__lt=models.F("end_datetime")),
                violation_error_message=_("`start_datetime` must be before `end_datetime`."),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.resource} {self.get_datetime_str()}"

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
