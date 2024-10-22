from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import CityManager

if TYPE_CHECKING:
    from .actions import CityActions

__all__ = [
    "City",
]


class City(models.Model):
    name: str = models.CharField(max_length=100)
    municipality_code: str = models.CharField(max_length=30, default="")

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects = CityManager()

    class Meta:
        db_table = "city"
        base_manager_name = "objects"
        verbose_name = _("city")
        verbose_name_plural = _("cities")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> CityActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import CityActions

        return CityActions(self)
