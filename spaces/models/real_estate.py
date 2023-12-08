from decimal import Decimal

from django.db import models

__all__ = [
    "RealEstate",
]


class RealEstate(models.Model):
    name: str = models.CharField(max_length=255)
    surface_area: Decimal | None = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def __str__(self) -> str:
        return self.name
