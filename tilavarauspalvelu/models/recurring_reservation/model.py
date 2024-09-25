from __future__ import annotations

import uuid as uuid_
from functools import cached_property
from typing import TYPE_CHECKING

from django.core.validators import validate_comma_separated_integer_list
from django.db import models

from config.utils.commons import WEEKDAYS
from tilavarauspalvelu.enums import ReservationStateChoice

from .queryset import RecurringReservationQuerySet

if TYPE_CHECKING:
    import datetime

    from applications.models import AllocatedTimeSlot
    from tilavarauspalvelu.models import AbilityGroup, AgeGroup, Reservation, ReservationUnit, User

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
        choices=WEEKDAYS.CHOICES,
        blank=True,
        default="",
    )

    # Relations

    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="recurring_reservations",
    )
    user: User | None = models.ForeignKey(
        "tilavarauspalvelu.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    allocated_time_slot: AllocatedTimeSlot | None = models.OneToOneField(
        "applications.AllocatedTimeSlot",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservation",
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    # TODO: Remove these fields
    ability_group: AbilityGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    objects = RecurringReservationQuerySet.as_manager()

    class Meta:
        db_table = "recurring_reservation"
        base_manager_name = "objects"
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

    @property
    def denied_reservations(self):  # DEPRECATED
        """Used in `api.legacy_rest_api.serializers.RecurringReservationSerializer`"""
        # Avoid a query to the database if we have fetched list already
        reservation: Reservation  # noqa: F842
        if "reservations" in self._prefetched_objects_cache:
            return [
                reservation
                for reservation in self.reservations.all()
                if reservation.state == ReservationStateChoice.DENIED
            ]

        return self.reservations.filter(state=ReservationStateChoice.DENIED)
