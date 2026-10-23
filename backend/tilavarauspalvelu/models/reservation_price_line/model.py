from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import PriceUnit
from tilavarauspalvelu.typing import error_codes
from utils.auditlog_util import AuditLogger
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import PaymentAccounting, PaymentProduct, PriceComponent, Reservation

    from .actions import ReservationPriceLineActions
    from .queryset import ReservationPriceLineManager
    from .validators import ReservationPriceLineValidator


__all__ = [
    "ReservationPriceLine",
]


class ReservationPriceLine(models.Model):
    """
    One line of a reservation's price.
    The values are copies, so a later change to the price component or the tax rate does not change the line.
    """

    reservation: Reservation = models.ForeignKey(
        "tilavarauspalvelu.Reservation",
        related_name="price_lines",
        on_delete=models.CASCADE,
    )
    price_component: PriceComponent | None = models.ForeignKey(
        "tilavarauspalvelu.PriceComponent",
        related_name="price_lines",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    description: str = models.CharField(max_length=255, blank=True, default="")

    # Minutes in a part of a day can give a fraction, so four decimals keep `quantity * unit_amount` close to `amount`.
    quantity: Decimal = models.DecimalField(max_digits=12, decimal_places=4)
    price_unit: PriceUnit = TextChoicesField(enum=PriceUnit)

    # Gross amounts, VAT included
    unit_amount: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    amount_before_adjustment: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    adjustment_percentage: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal(0))
    amount: Decimal = models.DecimalField(max_digits=10, decimal_places=2)

    # Set by the handler. If set, this is the final amount of the line.
    override_amount: Decimal | None = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    tax_percentage: Decimal = models.DecimalField(max_digits=5, decimal_places=2)
    vat_code: str = models.CharField(max_length=2, blank=True, default="")

    accounting: PaymentAccounting | None = models.ForeignKey(
        "tilavarauspalvelu.PaymentAccounting",
        related_name="reservation_price_lines",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    payment_product: PaymentProduct | None = models.ForeignKey(
        "tilavarauspalvelu.PaymentProduct",
        related_name="reservation_price_lines",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    # Translated field hints
    description_fi: str | None
    description_en: str | None
    description_sv: str | None

    objects: ClassVar[ReservationPriceLineManager] = LazyModelManager.new()
    actions: LazyAttribute[ReservationPriceLineActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ReservationPriceLineValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_price_line"
        base_manager_name = "objects"
        verbose_name = _("reservation price line")
        verbose_name_plural = _("reservation price lines")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                name="reservation_price_line_quantity_positive",
                condition=models.Q(quantity__gt=0),
                violation_error_message="Quantity must be positive.",
                violation_error_code=error_codes.RESERVATION_PRICE_LINE_QUANTITY_NOT_POSITIVE,
            ),
            models.CheckConstraint(
                name="reservation_price_line_amounts_not_negative",
                condition=models.Q(unit_amount__gte=0, amount_before_adjustment__gte=0, amount__gte=0),
                violation_error_message="Amounts cannot be negative.",
                violation_error_code=error_codes.RESERVATION_PRICE_LINE_AMOUNT_NEGATIVE,
            ),
            models.CheckConstraint(
                name="reservation_price_line_override_amount_not_negative",
                condition=models.Q(override_amount__isnull=True) | models.Q(override_amount__gte=0),
                violation_error_message="Override amount cannot be negative.",
                violation_error_code=error_codes.RESERVATION_PRICE_LINE_AMOUNT_NEGATIVE,
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quantity} x {self.unit_amount} ({self.price_unit}) = {self.amount}"


AuditLogger.register(ReservationPriceLine)
