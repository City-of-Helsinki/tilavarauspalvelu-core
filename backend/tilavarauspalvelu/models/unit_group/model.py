from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import UnitGroupActions
    from .queryset import UnitGroupManager
    from .validators import UnitGroupValidator


__all__ = [
    "UnitGroup",
]


class UnitGroup(models.Model):
    name: str = models.CharField(max_length=255)

    units = models.ManyToManyField("tilavarauspalvelu.Unit", related_name="unit_groups")

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[UnitGroupManager] = LazyModelManager.new()
    actions: UnitGroupActions = LazyModelAttribute.new()
    validators: UnitGroupValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "unit_group"
        base_manager_name = "objects"
        verbose_name = _("unit group")
        verbose_name_plural = _("unit groups")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
