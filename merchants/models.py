from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from merchants.enums import Language, OrderStatus, PaymentType
from merchants.validators import is_numeric, validate_accounting_project

__all__ = [
    "PaymentAccounting",
    "PaymentMerchant",
    "PaymentOrder",
    "PaymentProduct",
]


class PaymentMerchant(models.Model):
    """
    ID is not auto-generated. It comes from the Merchant experience API. See admin.py.
    https://checkout-dev-api.test.hel.ninja/v1/merchant/docs/swagger-ui/#
    """

    id = models.UUIDField(primary_key=True)
    name = models.CharField(blank=False, null=False, max_length=128)

    class Meta:
        db_table = "payment_merchant"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name


class PaymentProduct(models.Model):
    id = models.UUIDField(primary_key=True)
    merchant = models.ForeignKey(PaymentMerchant, related_name="products", on_delete=models.PROTECT, null=True)

    class Meta:
        db_table = "payment_product"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)


class PaymentOrder(models.Model):
    reservation = models.ForeignKey(
        "reservations.Reservation",
        related_name="payment_order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    remote_id = models.UUIDField(blank=True, null=True)
    payment_id = models.CharField(blank=True, null=False, default="", max_length=128)
    refund_id = models.UUIDField(blank=True, null=True)
    payment_type = models.CharField(blank=False, null=False, max_length=128, choices=PaymentType.choices)
    status = models.CharField(blank=False, null=False, max_length=128, choices=OrderStatus.choices, db_index=True)

    price_net = models.DecimalField(max_digits=10, decimal_places=2)
    price_vat = models.DecimalField(max_digits=10, decimal_places=2)
    price_total = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(null=False, auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    language = models.CharField(blank=False, null=False, max_length=8, choices=Language.choices)
    reservation_user_uuid = models.UUIDField(blank=True, null=True)
    checkout_url = models.CharField(blank=True, null=False, default="", max_length=512)
    receipt_url = models.CharField(blank=True, null=False, default="", max_length=512)

    class Meta:
        db_table = "payment_order"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"PaymentOrder {self.pk}"

    def save(self, *args, **kwargs) -> PaymentOrder:
        self.full_clean()
        return super().save(*args, **kwargs)

    def clean(self) -> None:
        validation_errors = {}

        failsafe_price_net = self.price_net or Decimal("0.0")
        failsafe_price_vat = self.price_vat or Decimal("0.0")

        if self.price_net is not None and self.price_net < Decimal("0.01"):
            validation_errors.setdefault("price_net", []).append(_("Must be greater than 0.01"))
        if self.price_vat is not None and self.price_vat < Decimal("0"):
            validation_errors.setdefault("price_vat", []).append(_("Must be greater than 0"))
        if self.price_total is not None and self.price_total != failsafe_price_net + failsafe_price_vat:
            validation_errors.setdefault("price_total", []).append(_("Must be the sum of net and vat amounts"))

        if validation_errors:
            raise ValidationError(validation_errors)

    @property
    def expires_at(self) -> datetime | None:
        if self.status != OrderStatus.DRAFT:
            return None

        return self.created_at + timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)


class PaymentAccounting(models.Model):
    """Custom validation comes from requirements in SAP"""

    name = models.CharField(blank=False, null=False, max_length=128)
    company_code = models.CharField(blank=False, null=False, max_length=4, validators=[is_numeric])
    main_ledger_account = models.CharField(blank=False, null=False, max_length=6, validators=[is_numeric])
    vat_code = models.CharField(blank=False, null=False, max_length=2)
    internal_order = models.CharField(blank=True, null=False, default="", max_length=10, validators=[is_numeric])
    profit_center = models.CharField(blank=True, null=False, default="", max_length=7, validators=[is_numeric])
    project = models.CharField(
        blank=True,
        null=False,
        default="",
        max_length=16,
        validators=[validate_accounting_project, is_numeric],
    )
    operation_area = models.CharField(blank=True, null=False, default="", max_length=6, validators=[is_numeric])
    balance_profit_center = models.CharField(blank=False, null=False, max_length=10)

    class Meta:
        db_table = "payment_accounting"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        from reservation_units.models import ReservationUnit
        from reservation_units.tasks import refresh_reservation_unit_accounting

        super().save(*args, **kwargs)
        if settings.UPDATE_ACCOUNTING:
            reservation_units_from_units = ReservationUnit.objects.filter(unit__in=self.units.all())
            reservation_units = reservation_units_from_units.union(self.reservation_units.all())
            for reservation_unit in reservation_units:
                refresh_reservation_unit_accounting.delay(reservation_unit.pk)

    def clean(self) -> None:
        if not self.project and not self.profit_center and not self.internal_order:
            error_message = _("One of the following fields must be given: internal_order, profit_center, project")
            raise ValidationError(
                {
                    "internal_order": [error_message],
                    "profit_center": [error_message],
                    "project": [error_message],
                }
            )
