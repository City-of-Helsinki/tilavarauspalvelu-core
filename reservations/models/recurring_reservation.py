from __future__ import annotations

import uuid as uuid_
from typing import TYPE_CHECKING

from django.core.validators import validate_comma_separated_integer_list
from django.db import models

from common.connectors import RecurringReservationActionsConnector
from reservations.enums import ReservationStateChoice
from reservations.querysets.recurring_reservation import RecurringReservationQuerySet
from tilavarauspalvelu.utils.commons import WEEKDAYS

if TYPE_CHECKING:
    import datetime

    from applications.models import AllocatedTimeSlot
    from reservation_units.models import ReservationUnit
    from reservations.models import AbilityGroup, AgeGroup
    from users.models import User

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
        "reservation_units.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="recurring_reservations",
    )
    user: User | None = models.ForeignKey(
        "users.User",
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
        "reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    # TODO: Remove these fields
    ability_group: AbilityGroup | None = models.ForeignKey(
        "reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )
    application_event_schedule = models.ForeignKey(
        "applications.ApplicationEventSchedule",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="recurring_reservations",
    )

    objects = RecurringReservationQuerySet.as_manager()
    actions = RecurringReservationActionsConnector()

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

    @property
    def denied_reservations(self):  # DEPRECATED
        """Used in `api.legacy_rest_api.serializers.RecurringReservationSerializer`"""
        # Avoid a query to the database if we have fetched list already
        if "reservations" in self._prefetched_objects_cache:
            return [
                reservation
                for reservation in self.reservations.all()
                if reservation.state == ReservationStateChoice.DENIED
            ]

        return self.reservations.filter(state=ReservationStateChoice.DENIED)
