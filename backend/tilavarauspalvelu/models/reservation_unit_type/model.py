from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationUnitTypeManager

if TYPE_CHECKING:
    from .actions import ReservationUnitTypeActions


__all__ = [
    "ReservationUnitType",
]


class ReservationUnitType(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name: str = models.CharField(max_length=255)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ReservationUnitTypeManager()

    class Meta:
        db_table = "reservation_unit_type"
        base_manager_name = "objects"
        verbose_name = _("reservation unit type")
        verbose_name_plural = _("reservation unit types")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ReservationUnitTypeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitTypeActions

        return ReservationUnitTypeActions(self)
