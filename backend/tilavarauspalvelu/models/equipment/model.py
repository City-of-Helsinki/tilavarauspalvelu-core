from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import EquipmentCategory

    from .actions import EquipmentActions
    from .queryset import EquipmentManager
    from .validators import EquipmentValidator

__all__ = [
    "Equipment",
]


class Equipment(models.Model):
    name: str = models.CharField(max_length=200)

    category: EquipmentCategory = models.ForeignKey(
        "tilavarauspalvelu.EquipmentCategory",
        related_name="equipment",
        on_delete=models.CASCADE,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[EquipmentManager] = LazyModelManager.new()
    actions: EquipmentActions = LazyModelAttribute.new()
    validators: EquipmentValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "equipment"
        base_manager_name = "objects"
        verbose_name = _("equipment")
        verbose_name_plural = _("equipments")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
