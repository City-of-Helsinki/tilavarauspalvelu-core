from functools import cached_property

from django.db import models

from .actions import EquipmentCategoryActions
from .queryset import EquipmentCategoryQuerySet

__all__ = [
    "EquipmentCategory",
]


class EquipmentCategory(models.Model):
    name = models.CharField(max_length=200)
    rank = models.PositiveIntegerField(blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = EquipmentCategoryQuerySet.as_manager()

    class Meta:
        db_table = "equipment_category"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> EquipmentCategoryActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import EquipmentCategoryActions

        return EquipmentCategoryActions(self)
