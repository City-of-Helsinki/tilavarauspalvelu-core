from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.contrib.postgres.fields import ArrayField, HStoreField
from django.db import models
from django.utils.translation import gettext_lazy as _

from common.fields.model import IntChoiceField
from tilavarauspalvelu.enums import WeekdayChoice
from tilavarauspalvelu.utils.validators import validate_reservable_times

from .queryset import ApplicationRoundTimeSlotQuerySet

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import TimeSlotDB

    from .actions import ApplicationRoundTimeSlotActions


class ApplicationRoundTimeSlot(models.Model):
    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        on_delete=models.CASCADE,
        related_name="application_round_time_slots",
    )

    weekday: int = IntChoiceField(enum=WeekdayChoice)
    closed: bool = models.BooleanField(default=False)
    reservable_times: list[TimeSlotDB] = ArrayField(
        base_field=HStoreField(),
        blank=True,
        default=list,
        validators=[validate_reservable_times],
    )

    objects = ApplicationRoundTimeSlotQuerySet.as_manager()

    class Meta:
        db_table = "application_round_time_slot"
        base_manager_name = "objects"
        verbose_name = _("Application Round Time Slot")
        verbose_name_plural = _("Application Round Time Slots")
        ordering = [
            "reservation_unit",
            "weekday",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["reservation_unit", "weekday"],
                name="unique_reservation_unit_weekday",
                violation_error_message="A reservation unit can only have one timeslot per weekday.",
                # Allows replacing reservable times for the same weekday
                # in the same reservation unit in a transaction
                deferrable=models.Deferrable.DEFERRED,
            ),
            models.CheckConstraint(
                check=(
                    (models.Q(closed=True) & models.Q(reservable_times__len=0))
                    | (models.Q(closed=False) & ~models.Q(reservable_times__len=0))
                ),
                name="closed_no_slots_check",
                violation_error_message="Closed timeslots cannot have reservable times, but open timeslots must.",
            ),
        ]

    def __str__(self) -> str:
        return f"Timeslots for {self.reservation_unit.name} on {WeekdayChoice(self.weekday).name.capitalize()}"

    @cached_property
    def actions(self) -> ApplicationRoundTimeSlotActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ApplicationRoundTimeSlotActions

        return ApplicationRoundTimeSlotActions(self)
