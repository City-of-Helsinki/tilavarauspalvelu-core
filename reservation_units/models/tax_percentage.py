from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "TaxPercentage",
]


class TaxPercentage(models.Model):
    value = models.DecimalField(
        verbose_name=_("Tax percentage"),
        max_digits=5,
        decimal_places=2,
        help_text="The tax percentage for a price",
    )

    class Meta:
        db_table = "tax_percentage"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.value}%"

    @property
    def decimal(self):
        return self.value / Decimal("100")
