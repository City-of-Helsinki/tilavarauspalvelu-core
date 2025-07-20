from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.models import PaymentMerchant, ReservationUnit
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

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
        blank=True,
        null=True,
    )

    objects: ClassVar[PaymentProductManager] = LazyModelManager.new()
    actions: PaymentProductActions = LazyModelAttribute.new()
    validators: PaymentProductValidator = LazyModelAttribute.new()

    reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "payment_product"
        base_manager_name = "objects"
        verbose_name = _("payment product")
        verbose_name_plural = _("payment products")
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)
