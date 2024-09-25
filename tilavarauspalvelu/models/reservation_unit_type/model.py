from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import ReservationUnitTypeQuerySet

if TYPE_CHECKING:
    from .actions import ReservationUnitTypeActions


__all__ = [
    "ReservationUnitType",
]


class ReservationUnitType(models.Model):
    name = models.CharField(max_length=255)
    rank = models.PositiveIntegerField(blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ReservationUnitTypeQuerySet.as_manager()

    class Meta:
        db_table = "reservation_unit_type"
        base_manager_name = "objects"
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ReservationUnitTypeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitTypeActions

        return ReservationUnitTypeActions(self)
