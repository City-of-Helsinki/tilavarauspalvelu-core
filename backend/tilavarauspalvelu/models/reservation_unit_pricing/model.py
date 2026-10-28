from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_nh3.models import Nh3CharField
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from utils.auditlog_util import AuditLogger
from utils.date_utils import local_date
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    import datetime

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import ReservationUnit, TaxLevel, TaxPercentage

    from .actions import ReservationUnitPricingActions
    from .queryset import ReservationUnitPricingManager
    from .validators import ReservationUnitPricingValidator


__all__ = [
    "ReservationUnitPricing",
]


class ReservationUnitPricing(models.Model):
    begins: datetime.date = models.DateField()
    price_unit: PriceUnit = TextChoicesField(enum=PriceUnit, default=PriceUnit.PER_HOUR)

    payment_type: PaymentType | None = TextChoicesField(enum=PaymentType, null=True, blank=True)

    # Not used. Kept so that migrations can be reversed. Removed in TILA-4558.
    is_activated_on_begins = models.BooleanField(default=False)

    lowest_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    highest_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    material_price_description: str = Nh3CharField(
        blank=True,
        default="",
        max_length=1000,  # Double of the limit of 500 chars in order to accommodate HTML tags
        allowed_tags=settings.NH3_ALLOWED_TAGS,
        allowed_attributes=settings.NH3_ALLOWED_ATTRIBUTES,
    )

    tax_level: TaxLevel = models.ForeignKey(
        "tilavarauspalvelu.TaxLevel",
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
    )

    # Not used. Kept so that migrations can be reversed. Removed in TILA-4558.
    tax_percentage: TaxPercentage | None = models.ForeignKey(
        "tilavarauspalvelu.TaxPercentage",
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
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
    actions: LazyAttribute[ReservationUnitPricingActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ReservationUnitPricingValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_pricing"
        base_manager_name = "objects"
        verbose_name = _("reservation unit pricing")
        verbose_name_plural = _("reservation unit pricings")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                name="lower_price_greater_than_highest_price",
                condition=models.Q(lowest_price__lte=models.F("highest_price")),
                violation_error_message="Lowest price can not be greater than highest price.",
            ),
            models.UniqueConstraint(
                name="reservation_unit_begin_date_unique_together",
                fields=["reservation_unit", "begins"],
                violation_error_message="Pricing for this reservation unit already exists for this date.",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.begins}: {self.lowest_price} - {self.highest_price} ({self.tax_level})"

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self.pk} ({self!s})>"

    @property
    def lowest_price_net(self) -> Decimal:
        today = local_date()
        tax_percentage = self.tax_level.actions.get_percentage(on_date=today)
        return self.lowest_price / (1 + tax_percentage / Decimal(100))

    @property
    def highest_price_net(self) -> Decimal:
        today = local_date()
        tax_percentage = self.tax_level.actions.get_percentage(on_date=today)
        return self.highest_price / (1 + tax_percentage / Decimal(100))


AuditLogger.register(ReservationUnitPricing)
