from __future__ import annotations

from decimal import Decimal
from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import TaxPercentageManager

if TYPE_CHECKING:
    from .actions import TaxPercentageActions

__all__ = [
    "TaxPercentage",
]


class TaxPercentage(models.Model):
    value: Decimal = models.DecimalField(max_digits=5, decimal_places=2)

    objects = TaxPercentageManager()

    class Meta:
        db_table = "tax_percentage"
        base_manager_name = "objects"
        verbose_name = _("tax percentage")
        verbose_name_plural = _("tax percentages")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.value}%"

    @cached_property
    def actions(self) -> TaxPercentageActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import TaxPercentageActions

        return TaxPercentageActions(self)

    @property
    def decimal(self) -> Decimal:
        return self.value / Decimal("100")

    @property
    def multiplier(self) -> Decimal:
        return 1 + self.decimal
