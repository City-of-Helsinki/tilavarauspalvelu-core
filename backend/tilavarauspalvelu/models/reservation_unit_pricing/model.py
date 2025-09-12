from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from undine.utils.model_fields import TextChoicesField

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.models import ReservationUnit, TaxPercentage

    from .actions import ReservationUnitPricingActions
    from .queryset import ReservationUnitPricingManager
    from .validators import ReservationUnitPricingValidator


__all__ = [
    "ReservationUnitPricing",
]


class ReservationUnitPricing(models.Model):
    begins: datetime.date = models.DateField()
    price_unit: PriceUnit = TextChoicesField(choices_enum=PriceUnit, default=PriceUnit.PER_HOUR)

    payment_type: PaymentType | None = TextChoicesField(choices_enum=PaymentType, null=True, blank=True)

    # True: This pricing is used for reservations that are created after the begins date
    # False: This pricing is used for reservations that start after the begins date
    is_activated_on_begins = models.BooleanField(default=False)

    lowest_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    highest_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    material_price_description: str = models.CharField(max_length=100, blank=True, default="")

    tax_percentage: TaxPercentage = models.ForeignKey(
        "tilavarauspalvelu.TaxPercentage",
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
    )

    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="pricings",
        on_delete=models.CASCADE,
    )

    # Translated field hints
    material_price_description_fi: str | None
    material_price_description_en: str | None
    material_price_description_sv: str | None

    objects: ClassVar[ReservationUnitPricingManager] = LazyModelManager.new()
    actions: ReservationUnitPricingActions = LazyModelAttribute.new()
    validators: ReservationUnitPricingValidator = LazyModelAttribute.new()

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
