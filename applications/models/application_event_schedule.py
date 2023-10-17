import datetime
import logging
from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.timezone import get_default_timezone

from applications.choices import PriorityChoice, WeekdayChoice
from applications.querysets.application_event_schedule import ApplicationEventScheduleQuerySet
from common.connectors import ApplicationEventScheduleActionsConnector
from common.fields.model import IntChoiceField

if TYPE_CHECKING:
    from actions.application_event_schedule import EventOccurrence


__all__ = [
    "ApplicationEventSchedule",
]


DEFAULT_TIMEZONE = get_default_timezone()
logger = logging.getLogger(__name__)
User = get_user_model()


class ApplicationEventSchedule(models.Model):
    """Time request for an application event. Allocated times filled if request accepted in allocation."""

    # What time was requested by the applicant
    day: int = IntChoiceField(enum=WeekdayChoice)
    begin: datetime.time = models.TimeField()
    end: datetime.time = models.TimeField()

    # If the request is accepted, what time was allocated by the admin
    allocated_day: int | None = IntChoiceField(enum=WeekdayChoice, null=True, blank=True, default=None)
    allocated_begin: datetime.time | None = models.TimeField(null=True, blank=True, default=None)
    allocated_end: datetime.time | None = models.TimeField(null=True, blank=True, default=None)

    declined: bool = models.BooleanField(blank=True, default=False)
    priority: int = IntChoiceField(enum=PriorityChoice, blank=True, default=PriorityChoice.HIGH.value)

    application_event = models.ForeignKey(
        "applications.ApplicationEvent",
        on_delete=models.CASCADE,
        related_name="application_event_schedules",
    )
    allocated_reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        null=True,
        blank=True,
        default=None,
        on_delete=models.CASCADE,
        related_name="application_event_schedules",
    )

    objects = ApplicationEventScheduleQuerySet.as_manager()
    actions = ApplicationEventScheduleActionsConnector()

    class Meta:
        base_manager_name = "objects"
        ordering = ["application_event", "-priority"]
        indexes = [
            models.Index(
                fields=["application_event", "priority"],
                name="event_priority_index",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                name="begin_before_end",
                check=models.Q(begin__lte=models.F("end")),
                violation_error_message="Begin must be before end.",
            ),
            models.CheckConstraint(
                name="allocated_begin_before_end",
                check=(
                    (
                        models.Q(allocated_begin__isnull=True)
                        & models.Q(allocated_end__isnull=True)
                        & models.Q(allocated_day__isnull=True)
                        & models.Q(allocated_reservation_unit__isnull=True)
                    )
                    | (
                        models.Q(allocated_begin__isnull=False)
                        & models.Q(allocated_end__isnull=False)
                        & models.Q(allocated_day__isnull=False)
                        & models.Q(allocated_reservation_unit__isnull=False)
                        & models.Q(allocated_begin__lte=models.F("allocated_end"))
                    )
                ),
                violation_error_message=(
                    "Allocation day, allocated reservation unit, allocation begin, and allocation end "
                    "must all be set or null, and begin must be before end."
                ),
            ),
        ]

    def __str__(self) -> str:
        return f"ApplicationEventSchedule {self.day} {self.begin}-{self.end}"

    @property
    def accepted(self) -> bool:
        return (
            not self.declined
            and self.allocated_begin is not None
            and self.allocated_end is not None
            and self.allocated_day is not None
            and self.allocated_reservation_unit is not None
        )

    @property
    def desired_occurrences(self) -> "EventOccurrence":
        return self.actions.get_event_occurrences(
            self.day,
            self.begin,
            self.end,
            self.application_event.begin,
            self.application_event.end,
            self.application_event.biweekly,
        )

    @property
    def allocated_occurrences(self) -> "EventOccurrence":
        if not self.accepted:
            raise ValidationError("Cannot get allocated occurrences for unaccepted schedule")

        return self.actions.get_event_occurrences(
            self.allocated_day,
            self.allocated_begin,
            self.allocated_end,
            self.application_event.begin,
            self.application_event.end,
            self.application_event.biweekly,
        )
