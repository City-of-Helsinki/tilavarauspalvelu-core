from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import AllocatedTimeSlot
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.allocated_timeslot.queryset import AllocatedTimeSlotQuerySet

    from .actions import ReservationUnitOptionActions
    from .queryset import ReservationUnitOptionManager
    from .validators import ReservationUnitOptionValidator


__all__ = [
    "ReservationUnitOption",
]


class ReservationUnitOption(models.Model):
    preferred_order = models.PositiveIntegerField()
    is_rejected = models.BooleanField(default=False, blank=True)
    is_locked = models.BooleanField(default=False, blank=True)

    application_section = models.ForeignKey(
        "tilavarauspalvelu.ApplicationSection",
        related_name="reservation_unit_options",
        on_delete=models.CASCADE,
    )
    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_unit_options",
        on_delete=models.PROTECT,
    )

    objects: ClassVar[ReservationUnitOptionManager] = LazyModelManager.new()
    actions: LazyAttribute[ReservationUnitOptionActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ReservationUnitOptionValidator] = LazyModelAttribute.new()

    allocated_time_slots: OneToManyRelatedManager[AllocatedTimeSlot, AllocatedTimeSlotQuerySet]

    class Meta:
        db_table = "reservation_unit_option"
        base_manager_name = "objects"
        verbose_name = _("reservation unit option")
        verbose_name_plural = _("reservation unit options")
        ordering = ["pk"]
        constraints = [
            models.UniqueConstraint(
                name="unique_application_section_preferred_order",
                fields=["application_section", "preferred_order"],
                # Allows swapping `preferred_order` of two reservation units
                # for the same application section in a transaction
                deferrable=models.Deferrable.DEFERRED,
                violation_error_message=_("Preferred order must be unique for each application section"),
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.preferred_order}) application section '{self.application_section.name}' "
            f"reservation unit '{self.reservation_unit.name}'"
        )
