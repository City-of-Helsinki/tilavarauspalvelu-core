from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import AbilityGroupManager

if TYPE_CHECKING:
    from .actions import AbilityGroupActions


__all__ = [
    "AbilityGroup",
]


class AbilityGroup(models.Model):
    name: str = models.TextField(unique=True)

    objects = AbilityGroupManager()

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "ability_group"
        base_manager_name = "objects"
        verbose_name = _("ability group")
        verbose_name_plural = _("ability groups")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> AbilityGroupActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import AbilityGroupActions

        return AbilityGroupActions(self)
