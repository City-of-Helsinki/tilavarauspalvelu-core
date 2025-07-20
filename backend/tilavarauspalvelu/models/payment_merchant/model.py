from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.models import PaymentProduct, ReservationUnit, Unit
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.payment_product.queryset import PaymentProductQuerySet
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
    from tilavarauspalvelu.models.unit.queryset import UnitQuerySet

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

    products: OneToManyRelatedManager[PaymentProduct, PaymentProductQuerySet]
    units: OneToManyRelatedManager[Unit, UnitQuerySet]
    reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "payment_merchant"
        base_manager_name = "objects"
        verbose_name = _("payment merchant")
        verbose_name_plural = _("payment merchants")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
