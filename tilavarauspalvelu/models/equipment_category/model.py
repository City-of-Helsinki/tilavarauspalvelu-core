from functools import cached_property

from django.db import models

from .actions import EquipmentCategoryActions
from .queryset import EquipmentCategoryQuerySet

__all__ = [
    "EquipmentCategory",
]


class EquipmentCategory(models.Model):
    rank: int = models.PositiveIntegerField(default=0, null=False, blank=False, db_index=True)  # Used for ordering

    name = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = EquipmentCategoryQuerySet.as_manager()

    class Meta:
        db_table = "equipment_category"
        base_manager_name = "objects"
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> EquipmentCategoryActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import EquipmentCategoryActions

        return EquipmentCategoryActions(self)
