from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import TaxPercentageActions
    from .queryset import TaxPercentageManager
    from .validators import TaxPercentageValidator

__all__ = [
    "TaxPercentage",
]


class TaxPercentage(models.Model):
    value: Decimal = models.DecimalField(max_digits=5, decimal_places=2)

    objects: ClassVar[TaxPercentageManager] = LazyModelManager.new()
    actions: TaxPercentageActions = LazyModelAttribute.new()
    validators: TaxPercentageValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "tax_percentage"
        base_manager_name = "objects"
        verbose_name = _("tax percentage")
        verbose_name_plural = _("tax percentages")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.value}%"

    @property
    def decimal(self) -> Decimal:
        return self.value / Decimal(100)

    @property
    def multiplier(self) -> Decimal:
        return 1 + self.decimal
