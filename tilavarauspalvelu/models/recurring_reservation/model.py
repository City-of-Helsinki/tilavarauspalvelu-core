from __future__ import annotations

import uuid as uuid_
from functools import cached_property
from typing import TYPE_CHECKING

from django.core.validators import validate_comma_separated_integer_list
from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import WeekdayChoice

from .queryset import RecurringReservationManager

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import AbilityGroup, AgeGroup, AllocatedTimeSlot, ReservationUnit, User
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet

    from .actions import RecurringReservationActions


__all__ = [
    "RecurringReservation",
]


class RecurringReservation(models.Model):
    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=500, blank=True, default="")
    uuid: uuid_.UUID = models.UUIDField(default=uuid_.uuid4, editable=False, unique=True)
    created: datetime.datetime = models.DateTimeField(auto_now_add=True)

    begin_date: datetime.date | None = models.DateField(null=True)
    begin_time: datetime.time | None = models.TimeField(null=True)
    end_date: datetime.date | None = models.DateField(null=True)
    end_time: datetime.time | None = models.TimeField(null=True)

    recurrence_in_days: int | None = models.PositiveIntegerField(null=True, blank=True)

    weekdays: str = models.CharField(
        max_length=16,
        validators=[validate_comma_separated_integer_list],
        choices=WeekdayChoice.choices,
        blank=True,
        default="",
    )

    # Relations

    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="recurring_reservations",
        on_delete=models.PROTECT,
    )
    user: User | None = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="recurring_reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    allocated_time_slot: AllocatedTimeSlot | None = models.OneToOneField(
        "tilavarauspalvelu.AllocatedTimeSlot",
        related_name="recurring_reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AgeGroup",
        related_name="recurring_reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # TODO: Remove these fields
    ability_group: AbilityGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AbilityGroup",
        related_name="recurring_reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # Reverse relation typing helpers.
    reservations: ReservationQuerySet

    objects = RecurringReservationManager()

    class Meta:
        db_table = "recurring_reservation"
        base_manager_name = "objects"
        verbose_name = _("recurring reservation")
        verbose_name_plural = _("recurring reservations")
        ordering = [
            "begin_date",
            "begin_time",
            "reservation_unit",
        ]

    def __str__(self) -> str:
        return f"{self.name}"

    @cached_property
    def actions(self) -> RecurringReservationActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import RecurringReservationActions

        return RecurringReservationActions(self)
