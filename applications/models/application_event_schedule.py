import datetime

from django.db import models
from django.utils.translation import gettext_lazy as _

from applications.enums import WeekdayChoice
from common.fields.model import IntChoiceField

__all__ = [
    "ApplicationEventSchedule",
]


# Legacy. Still used for reservation models
class ReservationPriorityChoice(models.IntegerChoices):
    LOW = 100, _("Low")
    MEDIUM = 200, _("Medium")
    HIGH = 300, _("High")


# DEPRECATED: Use ApplicationSection and SuitableTimeRange models instead
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
    priority: int = IntChoiceField(
        enum=ReservationPriorityChoice,
        blank=True,
        default=ReservationPriorityChoice.HIGH.value,
    )

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

    class Meta:
        db_table = "application_event_schedule"
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
                check=(models.Q(end__hour=0) & models.Q(end__minute=0)) | models.Q(begin__lte=models.F("end")),
                violation_error_message="Begin must be before end, or end must be at midnight.",
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
                        & (
                            (models.Q(allocated_end__hour=0) & models.Q(allocated_end__minute=0))
                            | models.Q(allocated_begin__lte=models.F("allocated_end"))
                        )
                    )
                ),
                violation_error_message=(
                    "Allocation day, allocated reservation unit, allocation begin, and allocation end "
                    "must all be set or null, and begin must be before end, or end must be at midnight."
                ),
            ),
        ]

    def __str__(self) -> str:
        return f"ApplicationEventSchedule {self.day} {self.begin}-{self.end}"
