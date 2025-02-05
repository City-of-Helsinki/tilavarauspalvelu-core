from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import UnitGroupManager

if TYPE_CHECKING:
    from .actions import UnitGroupActions


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

    objects = UnitGroupManager()

    class Meta:
        db_table = "unit_group"
        base_manager_name = "objects"
        verbose_name = _("unit group")
        verbose_name_plural = _("unit groups")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> UnitGroupActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import UnitGroupActions

        return UnitGroupActions(self)
