from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import AbilityGroupQuerySet

if TYPE_CHECKING:
    from .actions import AbilityGroupActions


__all__ = [
    "AbilityGroup",
]


class AbilityGroup(models.Model):
    name = models.fields.TextField(null=False, blank=False, unique=True)

    objects = AbilityGroupQuerySet.as_manager()

    class Meta:
        db_table = "ability_group"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> AbilityGroupActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import AbilityGroupActions

        return AbilityGroupActions(self)
