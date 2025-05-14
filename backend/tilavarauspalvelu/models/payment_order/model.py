from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.models import Reservation

    from .actions import PaymentOrderActions
    from .queryset import PaymentOrderManager
    from .validators import PaymentOrderValidator


__all__ = [
    "PaymentOrder",
]


class PaymentOrder(models.Model):
    reservation: Reservation | None = models.OneToOneField(
        "tilavarauspalvelu.Reservation",
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
    # Only set when reservation also requires handling, meaning user cannot pay directly during checkout.
    handled_payment_due_by: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    language: str = models.CharField(max_length=8, choices=Language.choices)
    reservation_user_uuid: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    checkout_url: str = models.CharField(blank=True, default="", max_length=512)
    receipt_url: str = models.CharField(blank=True, default="", max_length=512)

    objects: ClassVar[PaymentOrderManager] = LazyModelManager.new()
    actions: PaymentOrderActions = LazyModelAttribute.new()
    validators: PaymentOrderValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "payment_order"
        base_manager_name = "objects"
        verbose_name = _("payment order")
        verbose_name_plural = _("payment orders")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                check=(
                    ~models.Q(status=OrderStatus.PENDING)
                    | (models.Q(status=OrderStatus.PENDING) & models.Q(handled_payment_due_by__isnull=False))
                ),
                name="pending_orders_must_have_due_date",
                violation_error_message="Orders in status 'PENDING' must have 'handled_payment_due_by' set.",
            ),
        ]

    def __str__(self) -> str:
        return f"PaymentOrder {self.pk}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def clean(self) -> None:
        validation_errors = {}

        failsafe_price_net = self.price_net or Decimal("0.0")
        failsafe_price_vat = self.price_vat or Decimal("0.0")

        if self.price_net is not None and self.price_net < Decimal("0.01"):
            validation_errors.setdefault("price_net", []).append(_("Must be greater than 0.01"))
        if self.price_vat is not None and self.price_vat < Decimal(0):
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
