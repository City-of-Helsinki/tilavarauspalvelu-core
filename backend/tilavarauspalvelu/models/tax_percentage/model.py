from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitPricing
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit_pricing.queryset import ReservationUnitPricingQuerySet

    from .actions import TaxPercentageActions
    from .queryset import TaxPercentageManager
    from .validators import TaxPercentageValidator

__all__ = [
    "TaxPercentage",
]


class TaxPercentage(models.Model):
    value: Decimal = models.DecimalField(max_digits=5, decimal_places=2)
    is_enabled: bool = models.BooleanField(blank=True, default=True)

    objects: ClassVar[TaxPercentageManager] = LazyModelManager.new()
    actions: TaxPercentageActions = LazyModelAttribute.new()
    validators: TaxPercentageValidator = LazyModelAttribute.new()

    reservation_unit_pricings: OneToManyRelatedManager[ReservationUnitPricing, ReservationUnitPricingQuerySet]

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
