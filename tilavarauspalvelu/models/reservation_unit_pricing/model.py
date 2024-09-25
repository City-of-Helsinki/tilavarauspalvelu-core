from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import PriceUnit, PricingStatus, PricingType

from .queryset import ReservationUnitPricingQuerySet

if TYPE_CHECKING:
    from decimal import Decimal

    from .actions import ReservationUnitPricingActions


__all__ = [
    "ReservationUnitPricing",
]


def get_default_tax_percentage() -> int:
    from tilavarauspalvelu.models import TaxPercentage

    return TaxPercentage.objects.order_by("value").first().pk


class ReservationUnitPricing(models.Model):
    begins = models.DateField(null=False, blank=False)
    pricing_type = models.CharField(max_length=20, choices=PricingType.choices, blank=True, null=True)
    price_unit = models.CharField(max_length=20, choices=PriceUnit.choices, default=PriceUnit.PRICE_UNIT_PER_HOUR)
    status = models.CharField(max_length=20, choices=PricingStatus.choices)

    lowest_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    highest_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    tax_percentage = models.ForeignKey(
        "tilavarauspalvelu.TaxPercentage",
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
        default=get_default_tax_percentage,
    )

    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        null=True,
        related_name="pricings",
        on_delete=models.CASCADE,
    )

    objects = ReservationUnitPricingQuerySet.as_manager()

    class Meta:
        db_table = "reservation_unit_pricing"
        base_manager_name = "objects"
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                name="lower_price_greater_than_highest_price",
                check=models.Q(lowest_price__lte=models.F("highest_price")),
                violation_error_message="Lowest price can not be greater than highest price.",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.begins}: {self.lowest_price} - {self.highest_price} ({self.tax_percentage.value})"

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self.pk} ({self!s})>"

    @cached_property
    def actions(self) -> ReservationUnitPricingActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitPricingActions

        return ReservationUnitPricingActions(self)

    @property
    def lowest_price_net(self) -> Decimal:
        if self.tax_percentage == 0:
            return self.lowest_price
        return self.lowest_price / self.tax_percentage.multiplier

    @property
    def highest_price_net(self) -> Decimal:
        if self.tax_percentage == 0:
            return self.highest_price
        return self.highest_price / self.tax_percentage.multiplier


AuditLogger.register(ReservationUnitPricing)
