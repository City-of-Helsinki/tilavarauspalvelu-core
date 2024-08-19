from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from merchants.enums import Language, OrderStatus, PaymentType
from merchants.validators import is_numeric, validate_accounting_project

if TYPE_CHECKING:
    import uuid

    from reservations.models import Reservation

__all__ = [
    "PaymentAccounting",
    "PaymentMerchant",
    "PaymentOrder",
    "PaymentProduct",
]


class PaymentMerchant(models.Model):
    """
    ID is not auto-generated. It comes from the Merchant experience API. See admin.py.
    https://checkout-test-api.test.hel.ninja/v1/merchant/docs/swagger-ui/
    """

    id: uuid.UUID = models.UUIDField(primary_key=True)
    name: str = models.CharField(max_length=128)

    class Meta:
        db_table = "payment_merchant"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name


class PaymentProduct(models.Model):
    id: uuid.UUID = models.UUIDField(primary_key=True)

    merchant: PaymentMerchant | None = models.ForeignKey(
        "merchants.PaymentMerchant",
        related_name="products",
        on_delete=models.PROTECT,
        null=True,
    )

    class Meta:
        db_table = "payment_product"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)


class PaymentOrder(models.Model):
    reservation: Reservation | None = models.ForeignKey(
        "reservations.Reservation",
        related_name="payment_order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    remote_id: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    payment_id: str = models.CharField(blank=True, default="", max_length=128)
    refund_id: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    payment_type: str = models.CharField(max_length=128, choices=PaymentType.choices)
    status: str = models.CharField(max_length=128, choices=OrderStatus.choices, db_index=True)

    price_net: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    price_vat: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    price_total: Decimal = models.DecimalField(max_digits=10, decimal_places=2)

    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)
    processed_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    language: str = models.CharField(max_length=8, choices=Language.choices)
    reservation_user_uuid: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    checkout_url: str = models.CharField(blank=True, default="", max_length=512)
    receipt_url: str = models.CharField(blank=True, default="", max_length=512)

    class Meta:
        db_table = "payment_order"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"PaymentOrder {self.pk}"

    def save(self, *args: Any, **kwargs: Any) -> PaymentOrder:
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
    def expires_at(self) -> datetime.datetime | None:
        if self.status != OrderStatus.DRAFT:
            return None

        return self.created_at + datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)


class PaymentAccounting(models.Model):
    """Custom validation comes from requirements in SAP"""

    name: str = models.CharField(max_length=128)
    company_code: str = models.CharField(max_length=4, validators=[is_numeric])
    main_ledger_account: str = models.CharField(max_length=6, validators=[is_numeric])
    vat_code: str = models.CharField(max_length=2)
    internal_order: str = models.CharField(blank=True, default="", max_length=10, validators=[is_numeric])
    profit_center: str = models.CharField(blank=True, default="", max_length=7, validators=[is_numeric])
    project: str = models.CharField(
        blank=True,
        default="",
        max_length=16,
        validators=[validate_accounting_project, is_numeric],
    )
    operation_area: str = models.CharField(blank=True, default="", max_length=6, validators=[is_numeric])
    balance_profit_center: str = models.CharField(max_length=10)

    class Meta:
        db_table = "payment_accounting"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args: Any, **kwargs: Any) -> None:
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
