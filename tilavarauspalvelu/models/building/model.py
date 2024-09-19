from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import BuildingManager

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.models import RealEstate

    from .actions import BuildingActions


__all__ = [
    "Building",
]


class Building(models.Model):
    name: str = models.CharField(max_length=255)
    surface_area: Decimal | None = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    real_estate: RealEstate | None = models.ForeignKey(
        "tilavarauspalvelu.RealEstate",
        related_name="buildings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects = BuildingManager()

    class Meta:
        db_table = "building"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> BuildingActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import BuildingActions

        return BuildingActions(self)
