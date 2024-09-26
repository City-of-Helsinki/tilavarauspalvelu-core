from functools import cached_property

from django.db import models
from django.utils.translation import gettext_lazy as _

from .actions import EquipmentCategoryActions
from .queryset import EquipmentCategoryManager

__all__ = [
    "EquipmentCategory",
]


class EquipmentCategory(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name: str = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = EquipmentCategoryManager()

    class Meta:
        db_table = "equipment_category"
        base_manager_name = "objects"
        verbose_name = _("equipment category")
        verbose_name_plural = _("equipment categories")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> EquipmentCategoryActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import EquipmentCategoryActions

        return EquipmentCategoryActions(self)
