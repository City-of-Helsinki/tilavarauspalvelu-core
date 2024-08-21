from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    import uuid


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
