from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import AgeGroupManager

if TYPE_CHECKING:
    from .actions import AgeGroupActions

__all__ = [
    "AgeGroup",
]


class AgeGroup(models.Model):
    minimum: int = models.PositiveIntegerField()
    maximum: int | None = models.PositiveIntegerField(null=True, blank=True)

    objects = AgeGroupManager()

    class Meta:
        db_table = "age_group"
        base_manager_name = "objects"
        verbose_name = _("age group")
        verbose_name_plural = _("age groups")
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
