from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import PaymentMerchantManager

if TYPE_CHECKING:
    import uuid

    from .actions import PaymentMerchantActions


__all__ = [
    "PaymentMerchant",
]


class PaymentMerchant(models.Model):
    """
    ID is not auto-generated. It comes from the Merchant experience API. See admin.py.
    https://checkout-test-api.test.hel.ninja/v1/merchant/docs/swagger-ui/
    """

    id: uuid.UUID = models.UUIDField(primary_key=True)
    name: str = models.CharField(max_length=128)

    objects = PaymentMerchantManager()

    class Meta:
        db_table = "payment_merchant"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> PaymentMerchantActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PaymentMerchantActions

        return PaymentMerchantActions(self)
