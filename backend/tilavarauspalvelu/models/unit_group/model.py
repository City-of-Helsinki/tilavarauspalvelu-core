from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Unit, UnitRole
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager
    from tilavarauspalvelu.models.unit.queryset import UnitQuerySet
    from tilavarauspalvelu.models.unit_role.queryset import UnitRoleQuerySet

    from .actions import UnitGroupActions
    from .queryset import UnitGroupManager
    from .validators import UnitGroupValidator


__all__ = [
    "UnitGroup",
]


class UnitGroup(models.Model):
    name: str = models.CharField(max_length=255)

    units: ManyToManyRelatedManager[Unit, UnitQuerySet] = models.ManyToManyField(
        "tilavarauspalvelu.Unit",
        related_name="unit_groups",
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[UnitGroupManager] = LazyModelManager.new()
    actions: UnitGroupActions = LazyModelAttribute.new()
    validators: UnitGroupValidator = LazyModelAttribute.new()

    unit_roles: ManyToManyRelatedManager[UnitRole, UnitRoleQuerySet]

    class Meta:
        db_table = "unit_group"
        base_manager_name = "objects"
        verbose_name = _("unit group")
        verbose_name_plural = _("unit groups")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
