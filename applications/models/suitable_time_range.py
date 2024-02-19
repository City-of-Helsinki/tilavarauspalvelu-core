from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from applications.choices import Priority, Weekday
from applications.querysets.suitable_time_range import SuitableTimeRangeQuerySet
from common.connectors import SuitableTimeRangeActionsConnector
from common.fields.model import StrChoiceField

if TYPE_CHECKING:
    from applications.models import ApplicationSection


__all__ = [
    "SuitableTimeRange",
]


class SuitableTimeRange(models.Model):
    """Represent a time range that the applicant has marked as suitable for their application section."""

    priority: str = StrChoiceField(enum=Priority)
    day_of_the_week: str = StrChoiceField(enum=Weekday)
    begin_time: datetime.time = models.TimeField()
    end_time: datetime.time = models.TimeField()

    application_section: ApplicationSection = models.ForeignKey(
        "applications.ApplicationSection",
        on_delete=models.CASCADE,
        related_name="suitable_time_ranges",
    )

    objects = SuitableTimeRangeQuerySet.as_manager()
    actions = SuitableTimeRangeActionsConnector()

    class Meta:
        db_table = "suitable_time_range"
        base_manager_name = "objects"
        verbose_name = _("Suitable Timerange")
        verbose_name_plural = _("Suitable Timeranges")
        constraints = [
            models.CheckConstraint(
                check=models.Q(begin_time__lt=models.F("end_time")),
                name="begin_time_before_end_time_suitable",
                violation_error_message=_("Begin time must be before end time."),
            ),
            models.CheckConstraint(
                check=models.Q(begin_time__minute=0, end_time__minute=0),
                name="begin_and_end_time_multiple_of_60_minutes_suitable",
                violation_error_message=_("Begin and end times must be a multiples of 60 minutes."),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.day_of_the_week} {self.begin_time.isoformat()}-{self.end_time.isoformat()}"
