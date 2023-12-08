from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from django.db import models

if TYPE_CHECKING:
    from spaces.models import RealEstate

__all__ = [
    "Building",
]


class Building(models.Model):
    name: str = models.CharField(max_length=255)
    surface_area: Decimal | None = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    real_estate: Optional["RealEstate"] = models.ForeignKey(
        "spaces.RealEstate",
        related_name="buildings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return self.name
