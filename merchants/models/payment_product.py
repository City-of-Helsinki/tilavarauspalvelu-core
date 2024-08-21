from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    import uuid

    from merchants.models.payment_merchant import PaymentMerchant


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
