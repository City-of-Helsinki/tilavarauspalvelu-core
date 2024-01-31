from datetime import date, datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models.functions import Cast, Mod

from applications.choices import WeekdayChoice
from common.fields.model import IntChoiceField
from reservations.choices import ReservationStateChoice

if TYPE_CHECKING:
    from applications.models import ApplicationEventSchedule
    from reservation_units.models import ReservationUnit
    from reservations.models import AbilityGroup, AgeGroup
    from users.models import User

__all__ = [
    "RecurringReservation",
]


class RecurringReservation(models.Model):
    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=500, blank=True, default="")
    uuid: UUID = models.UUIDField(default=uuid4, editable=False, unique=True)

    begin_date: date | None = models.DateField(null=True, blank=True)
    begin_time: date | None = models.TimeField(null=True, blank=True)
    end_date: date | None = models.DateField(null=True, blank=True)
    end_time: date | None = models.TimeField(null=True, blank=True)

    recurrence_in_days: int | None = models.PositiveIntegerField(null=True, blank=True)
    """How many days between reoccurring reservations"""

    weekdays: list[int] = ArrayField(
        base_field=IntChoiceField(enum=WeekdayChoice),
        default=list,
        blank=True,
    )

    reservation_unit: "ReservationUnit" = models.ForeignKey(
        "reservation_units.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="recurring_reservations",
    )
    user: Optional["User"] = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )
    application_event_schedule: Optional["ApplicationEventSchedule"] = models.ForeignKey(
        "applications.ApplicationEventSchedule",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="recurring_reservations",
    )
    age_group: Optional["AgeGroup"] = models.ForeignKey(
        "reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )
    ability_group: Optional["AbilityGroup"] = models.ForeignKey(
        "reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    created: datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recurring_reservation"
        base_manager_name = "objects"
        ordering = ["begin_date", "begin_time", "reservation_unit"]
        constraints = [
            models.CheckConstraint(
                name="begin_datetime_before_end_datetime",
                check=(
                    (
                        # None of them are set
                        models.Q(begin_date__isnull=True)
                        & models.Q(begin_time__isnull=True)
                        & models.Q(end_date__isnull=True)
                        & models.Q(end_time__isnull=True)
                    )
                    | (
                        # All of them are set, and begin is before end
                        models.Q(begin_date__isnull=False)
                        & models.Q(begin_time__isnull=False)
                        & models.Q(end_date__isnull=False)
                        & models.Q(end_time__isnull=False)
                        & (
                            models.Q(begin_date__lt=models.F("end_date"))
                            | (
                                models.Q(begin_date=models.F("end_date"))
                                & models.Q(begin_time__lt=models.F("end_time"))
                            )
                        )
                    )
                ),
                violation_error_message=(
                    "Reoccurring reservation must begin before it ends, or all fields must be null."
                ),
            ),
            models.CheckConstraint(
                name="recurrence_is_multiple_of_seven",
                check=(
                    models.Q(recurrence_in_days__isnull=True)
                    | (
                        models.Q(recurrence_in_days__gt=0)
                        # 1) 13 % 7 = 6 -> True -> False
                        # 2) 14 % 7 = 0 -> False -> True
                        & ~models.Q(Cast(Mod("recurrence_in_days", 7), output_field=models.BooleanField()))
                    )
                ),
                violation_error_message="`recurrence_in_days` value must be null or a multiple of seven.",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name}"

    @property
    def denied_reservations(self):
        # TODO: Legacy, used in `api.legacy_rest_api.serializers.RecurringReservationSerializer`
        # Avoid a query to the database if we have fetched list already
        if "reservations" in self._prefetched_objects_cache:
            return [
                reservation
                for reservation in self.reservations.all()
                if reservation.state == ReservationStateChoice.DENIED
            ]

        return self.reservations.filter(state=ReservationStateChoice.DENIED)
