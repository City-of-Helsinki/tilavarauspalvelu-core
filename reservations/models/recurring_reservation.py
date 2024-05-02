import datetime
import uuid as uuid_

from django.core.validators import validate_comma_separated_integer_list
from django.db import models

from common.connectors import RecurringReservationActionsConnector
from reservations.choices import ReservationStateChoice
from tilavarauspalvelu.utils.commons import WEEKDAYS

__all__ = [
    "RecurringReservation",
]


class RecurringReservation(models.Model):
    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=500, blank=True, default="")
    uuid: uuid_.UUID = models.UUIDField(default=uuid_.uuid4, editable=False, unique=True)
    user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)

    begin_date: datetime.date | None = models.DateField(null=True)
    begin_time: datetime.time | None = models.TimeField(null=True)
    end_date: datetime.date | None = models.DateField(null=True)
    end_time: datetime.time | None = models.TimeField(null=True)

    application_event_schedule = models.ForeignKey(
        "applications.ApplicationEventSchedule",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="recurring_reservations",
    )

    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="recurring_reservations",
    )

    recurrence_in_days: int | None = models.PositiveIntegerField(null=True)
    """How many days between reoccurring reservations"""

    weekdays: str = models.CharField(
        max_length=16,
        validators=[validate_comma_separated_integer_list],
        choices=WEEKDAYS.CHOICES,
        blank=True,
        default="",
    )

    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    ability_group = models.ForeignKey(
        "reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    created: datetime.datetime = models.DateTimeField(auto_now_add=True)

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
