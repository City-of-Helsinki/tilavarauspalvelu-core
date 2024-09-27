from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Value
from django.db.models.functions import Cast, Concat
from django.utils.translation import gettext_lazy as _
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import Weekday
from utils.fields.model import StrChoiceField

from .queryset import AllocatedTimeSlotQuerySet

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import ReservationUnitOption

    from .actions import AllocatedTimeSlotActions


__all__ = [
    "AllocatedTimeSlot",
]


class AllocatedTimeSlot(models.Model):
    """
    An allocated timeslot for a reservation unit option in an application section.
    Usually selected from the application sections suitable timeranges.
    Will be converted to reservations when the application round has been allocated.
    """

    day_of_the_week: str = StrChoiceField(enum=Weekday)
    begin_time: datetime.time = models.TimeField()
    end_time: datetime.time = models.TimeField()

    reservation_unit_option: ReservationUnitOption = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnitOption",
        on_delete=models.CASCADE,
        related_name="allocated_time_slots",
    )

    objects = AllocatedTimeSlotQuerySet.as_manager()

    class Meta:
        db_table = "allocated_time_slot"
        base_manager_name = "objects"
        verbose_name = _("Allocated Time Slot")
        verbose_name_plural = _("Allocated Time Slots")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(begin_time__lt=models.F("end_time"))  # begin before end
                    | (
                        models.Q(end_time__hour=0)  # end at midnight, but start not
                        & ~models.Q(begin_time__hour=0)
                    )
                ),
                name="begin_time_before_end_time_allocated",
                violation_error_message=_("Begin time must be before end time."),
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{Weekday(self.day_of_the_week).label} "
            f"{self.begin_time.isoformat(timespec="minutes")}-{self.end_time.isoformat(timespec="minutes")}"
        )

    @cached_property
    def actions(self) -> AllocatedTimeSlotActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import AllocatedTimeSlotActions

        return AllocatedTimeSlotActions(self)

    @lookup_property
    def allocated_time_of_week() -> str:
        return Concat(  # type: ignore[return-value]
            Cast(L("day_of_the_week_number"), output_field=models.CharField()),
            Value("-"),
            Cast("begin_time", output_field=models.CharField()),
            Value("-"),
            Cast("end_time", output_field=models.CharField()),
        )

    @lookup_property
    def day_of_the_week_number() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(day_of_the_week=Weekday.MONDAY.value, then=models.Value(1)),
            models.When(day_of_the_week=Weekday.TUESDAY.value, then=models.Value(2)),
            models.When(day_of_the_week=Weekday.WEDNESDAY.value, then=models.Value(3)),
            models.When(day_of_the_week=Weekday.THURSDAY.value, then=models.Value(4)),
            models.When(day_of_the_week=Weekday.FRIDAY.value, then=models.Value(5)),
            models.When(day_of_the_week=Weekday.SATURDAY.value, then=models.Value(6)),
            models.When(day_of_the_week=Weekday.SUNDAY.value, then=models.Value(7)),
            default=models.Value(8),
            output_field=models.IntegerField(),
        )
