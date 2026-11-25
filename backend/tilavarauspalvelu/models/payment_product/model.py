from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import ReservationPriceLine
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_price_line.queryset import ReservationPriceLineQuerySet

    from .actions import PaymentProductActions
    from .queryset import PaymentProductManager
    from .validators import PaymentProductValidator


__all__ = [
    "PaymentProduct",
]


class PaymentProduct(models.Model):
    id = models.UUIDField(primary_key=True)

    merchant = models.ForeignKey(
        "tilavarauspalvelu.PaymentMerchant",
        related_name="products",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="payment_products",
        on_delete=models.CASCADE,
    )
    # Must allow null for the products from before migration 0199. They were made for a reservation unit,
    # not for a sales item, and the sales item of a product of an earlier merchant was not recorded.
    sales_item = models.ForeignKey(
        "tilavarauspalvelu.SalesItem",
        related_name="payment_products",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )

    objects: ClassVar[PaymentProductManager] = LazyModelManager.new()
    actions: LazyAttribute[PaymentProductActions] = LazyModelAttribute.new()
    validators: LazyAttribute[PaymentProductValidator] = LazyModelAttribute.new()

    reservation_price_lines: OneToManyRelatedManager[ReservationPriceLine, ReservationPriceLineQuerySet]

    class Meta:
        db_table = "payment_product"
        base_manager_name = "objects"
        verbose_name = _("payment product")
        verbose_name_plural = _("payment products")
        ordering = ["pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["reservation_unit", "sales_item", "merchant"],
                name="payment_product_unique_reservation_unit_sales_item_merchant",
                nulls_distinct=False,
                violation_error_message="A product already exists for this reservation unit, sales item and merchant.",
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)
