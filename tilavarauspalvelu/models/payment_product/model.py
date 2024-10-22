from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import PaymentProductManager

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.models import PaymentMerchant

    from .actions import PaymentProductActions


__all__ = [
    "PaymentProduct",
]


class PaymentProduct(models.Model):
    id: uuid.UUID = models.UUIDField(primary_key=True)

    merchant: PaymentMerchant | None = models.ForeignKey(
        "tilavarauspalvelu.PaymentMerchant",
        related_name="products",
        on_delete=models.PROTECT,
        null=True,
    )

    objects = PaymentProductManager()

    class Meta:
        db_table = "payment_product"
        base_manager_name = "objects"
        verbose_name = _("payment product")
        verbose_name_plural = _("payment products")
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)

    @cached_property
    def actions(self) -> PaymentProductActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PaymentProductActions

        return PaymentProductActions(self)
