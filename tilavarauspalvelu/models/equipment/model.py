from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import EquipmentQuerySet

if TYPE_CHECKING:
    from .actions import EquipmentActions

__all__ = [
    "Equipment",
]


class Equipment(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        "tilavarauspalvelu.EquipmentCategory",
        related_name="equipment",
        on_delete=models.CASCADE,
        null=False,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = EquipmentQuerySet.as_manager()

    class Meta:
        db_table = "equipment"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> EquipmentActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import EquipmentActions

        return EquipmentActions(self)
