from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.models import PaymentMerchant

    from .actions import PaymentProductActions
    from .queryset import PaymentProductManager
    from .validators import PaymentProductValidator


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

    objects: ClassVar[PaymentProductManager] = LazyModelManager.new()
    actions: PaymentProductActions = LazyModelAttribute.new()
    validators: PaymentProductValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "payment_product"
        base_manager_name = "objects"
        verbose_name = _("payment product")
        verbose_name_plural = _("payment products")
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)
