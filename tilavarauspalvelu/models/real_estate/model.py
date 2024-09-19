from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import RealEstateManager

if TYPE_CHECKING:
    from decimal import Decimal

    from .actions import RealEstateActions


class RealEstate(models.Model):
    name: str = models.CharField(max_length=255)
    surface_area: Decimal | None = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = RealEstateManager()

    class Meta:
        db_table = "real_estate"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> RealEstateActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import RealEstateActions

        return RealEstateActions(self)
