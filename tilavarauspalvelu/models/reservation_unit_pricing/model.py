from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import PriceUnit

from .queryset import ReservationUnitPricingManager

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.models import ReservationUnit, TaxPercentage

    from .actions import ReservationUnitPricingActions


__all__ = [
    "ReservationUnitPricing",
]


def get_default_tax_percentage() -> int:
    from tilavarauspalvelu.models import TaxPercentage

    return TaxPercentage.objects.order_by("value").first().pk


class ReservationUnitPricing(models.Model):
    begins: datetime.date = models.DateField()
    price_unit: str = models.CharField(max_length=20, choices=PriceUnit.choices, default=PriceUnit.PRICE_UNIT_PER_HOUR)

    # True: This pricing is used for reservations that are created after the begins date
    # False: This pricing is used for reservations that start after the begins date
    is_activated_on_begins = models.BooleanField(default=False)

    lowest_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    highest_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    tax_percentage: TaxPercentage = models.ForeignKey(
        "tilavarauspalvelu.TaxPercentage",
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
        default=get_default_tax_percentage,
    )

    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="pricings",
        on_delete=models.CASCADE,
        null=True,
    )

    objects = ReservationUnitPricingManager()

    class Meta:
        db_table = "reservation_unit_pricing"
        base_manager_name = "objects"
        verbose_name = _("reservation unit pricing")
        verbose_name_plural = _("reservation unit pricings")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                name="lower_price_greater_than_highest_price",
                check=models.Q(lowest_price__lte=models.F("highest_price")),
                violation_error_message="Lowest price can not be greater than highest price.",
            ),
            models.UniqueConstraint(
                name="reservation_unit_begin_date_unique_together",
                fields=["reservation_unit", "begins"],
                violation_error_message="Pricing for this reservation unit already exists for this date.",
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
