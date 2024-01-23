from datetime import date, timedelta
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from django.db import models
from django.db.models import Manager
from django.utils.functional import classproperty
from helsinki_gdpr.models import SerializableMixin

from applications.choices import ApplicationEventStatusChoice
from applications.querysets.application_event import ApplicationEventQuerySet
from common.connectors import ApplicationEventActionsConnector

if TYPE_CHECKING:
    from applications.models import ApplicationEventSchedule

__all__ = [
    "ApplicationEvent",
]


class ApplicationEventManager(SerializableMixin.SerializableManager, Manager.from_queryset(ApplicationEventQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""


class ApplicationEvent(SerializableMixin, models.Model):
    name: str = models.CharField(max_length=100, null=False, blank=True)
    uuid: UUID = models.UUIDField(default=uuid4, null=False, editable=False, unique=True)
    num_persons: int | None = models.PositiveIntegerField(null=True, blank=True)

    min_duration: timedelta | None = models.DurationField(null=True, blank=True)
    max_duration: timedelta | None = models.DurationField(null=True, blank=True)

    # Interval on which reservations for this event are created
    begin: date | None = models.DateField(null=True, blank=True)
    end: date | None = models.DateField(null=True, blank=True)

    events_per_week: int | None = models.PositiveIntegerField(null=True, blank=True)
    biweekly: bool = models.BooleanField(default=False, null=False, blank=True)
    flagged: bool = models.BooleanField(default=False, null=False, blank=True)

    application = models.ForeignKey(
        "applications.Application",
        null=False,
        on_delete=models.CASCADE,
        related_name="application_events",
    )
    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="application_events",
    )
    ability_group = models.ForeignKey(
        "reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="application_events",
    )
    purpose = models.ForeignKey(
        "reservations.ReservationPurpose",
        null=True,
        blank=False,
        on_delete=models.PROTECT,
        related_name="application_events",
    )

    objects = ApplicationEventManager()
    actions = ApplicationEventActionsConnector()

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "application_event"
        base_manager_name = "objects"

    # For GDPR API
    serialize_fields = (
        {"name": "name"},
        {"name": "name_fi"},
        {"name": "name_en"},
        {"name": "name_sv"},
    )

    def __str__(self) -> str:
        return self.name

    @property
    def status(self) -> ApplicationEventStatusChoice:
        schedules: list["ApplicationEventSchedule"] = list(self.application_event_schedules.all())

        if schedules and all(schedule.declined for schedule in schedules):
            return ApplicationEventStatusChoice.DECLINED
        if not schedules or all(not schedule.accepted for schedule in schedules):
            return ApplicationEventStatusChoice.UNALLOCATED
        if not any(schedule.reserved for schedule in schedules):
            return ApplicationEventStatusChoice.APPROVED
        if any(schedule.unsuccessfully_reserved for schedule in schedules):
            return ApplicationEventStatusChoice.FAILED
        return ApplicationEventStatusChoice.RESERVED

    @classproperty
    def required_for_review(cls) -> list[str]:
        return [
            "num_persons",
            "begin",
            "end",
            "min_duration",
            "events_per_week",
            "age_group",
        ]
