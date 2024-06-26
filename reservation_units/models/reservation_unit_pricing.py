from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from reservation_units.enums import PriceUnit, PricingStatus, PricingType
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

__all__ = [
    "ReservationUnitPricing",
]


def get_default_tax_percentage() -> int:
    from .tax_percentage import TaxPercentage

    return TaxPercentage.objects.order_by("value").first().pk


class ReservationUnitPricingQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()


class ReservationUnitPricing(models.Model):
    begins = models.DateField(
        verbose_name=_("Date when price is activated"),
        null=False,
        blank=False,
        help_text="When pricing is activated",
    )

    pricing_type = models.CharField(
        max_length=20,
        verbose_name=_("Pricing type"),
        choices=PricingType.choices,
        blank=True,
        null=True,
        help_text="What kind of pricing types are available with this reservation unit.",
    )

    price_unit = models.CharField(
        max_length=20,
        verbose_name=_("Price unit"),
        choices=PriceUnit.choices,
        default=PriceUnit.PRICE_UNIT_PER_HOUR,
        help_text="Unit of the price",
    )

    lowest_price = models.DecimalField(
        verbose_name=_("Lowest price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Minimum price of the reservation unit including VAT",
    )

    highest_price = models.DecimalField(
        verbose_name=_("Highest price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Maximum price of the reservation unit including VAT",
    )

    tax_percentage = models.ForeignKey(
        "reservation_units.TaxPercentage",
        verbose_name=_("Tax percentage"),
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
        default=get_default_tax_percentage,
        help_text="The percentage of tax included in the price",
    )

    status = models.CharField(
        max_length=20,
        verbose_name=_("Status"),
        choices=PricingStatus.choices,
        help_text="Status of the pricing",
    )

    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        verbose_name=_("Reservation unit"),
        null=True,
        blank=False,
        related_name="pricings",
        on_delete=models.CASCADE,
    )

    objects = ReservationUnitPricingQuerySet.as_manager()

    class Meta:
        db_table = "reservation_unit_pricing"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]
        constraints = [
            models.CheckConstraint(
                name="lower_price_greater_than_highest_price",
                check=models.Q(lowest_price__lte=models.F("highest_price")),
                violation_error_message="Lowest price can not be greater than highest price.",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.begins}: {self.lowest_price} - {self.highest_price} ({self.tax_percentage.value})"

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
