from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import AgeGroupQuerySet

if TYPE_CHECKING:
    from .actions import AgeGroupActions

__all__ = [
    "AgeGroup",
]


class AgeGroup(models.Model):
    minimum = models.fields.PositiveIntegerField(null=False, blank=False)
    maximum = models.fields.PositiveIntegerField(null=True, blank=True)

    objects = AgeGroupQuerySet.as_manager()

    class Meta:
        db_table = "age_group"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        if self.maximum is None:
            return f"{self.minimum}+"
        return f"{self.minimum} - {self.maximum}"

    @cached_property
    def actions(self) -> AgeGroupActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import AgeGroupActions

        return AgeGroupActions(self)
