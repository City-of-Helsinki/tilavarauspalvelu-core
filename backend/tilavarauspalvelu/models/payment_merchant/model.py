from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import uuid

    from .actions import PaymentMerchantActions
    from .queryset import PaymentMerchantManager
    from .validators import PaymentMerchantValidator


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

    objects: ClassVar[PaymentMerchantManager] = LazyModelManager.new()
    actions: PaymentMerchantActions = LazyModelAttribute.new()
    validators: PaymentMerchantValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "payment_merchant"
        base_manager_name = "objects"
        verbose_name = _("payment merchant")
        verbose_name_plural = _("payment merchants")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
