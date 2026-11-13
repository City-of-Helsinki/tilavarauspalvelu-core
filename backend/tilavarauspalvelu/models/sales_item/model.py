from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.core.validators import MinLengthValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.validators import is_numeric
from utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import PriceComponent, ReservationPriceLine, TaxLevel
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.price_component.queryset import PriceComponentQuerySet
    from tilavarauspalvelu.models.reservation_price_line.queryset import ReservationPriceLineQuerySet

    from .actions import SalesItemActions
    from .queryset import SalesItemManager
    from .validators import SalesItemValidator

__all__ = [
    "SalesItem",
]


class SalesItem(models.Model):
    """
    What a price component sells online, for accounting.
    The accounting fields that depend on the place come from the payment accounting.
    """

    name: str = models.CharField(max_length=255, unique=True)

    # Custom validation comes from requirements in SAP.
    # Only invoicing needs the material, so a sales item that is only paid in the web shop can leave it empty.
    material: str = models.CharField(
        max_length=8,
        blank=True,
        default="",
        validators=[MinLengthValidator(8), is_numeric],
    )
    main_ledger_account: str = models.CharField(max_length=6, validators=[is_numeric])

    tax_level: TaxLevel = models.ForeignKey(
        "tilavarauspalvelu.TaxLevel",
        related_name="sales_items",
        on_delete=models.PROTECT,
    )

    objects: ClassVar[SalesItemManager] = LazyModelManager.new()
    actions: LazyAttribute[SalesItemActions] = LazyModelAttribute.new()
    validators: LazyAttribute[SalesItemValidator] = LazyModelAttribute.new()

    price_components: OneToManyRelatedManager[PriceComponent, PriceComponentQuerySet]
    reservation_price_lines: OneToManyRelatedManager[ReservationPriceLine, ReservationPriceLineQuerySet]

    class Meta:
        db_table = "sales_item"
        base_manager_name = "objects"
        verbose_name = _("sales item")
        verbose_name_plural = _("sales items")
        ordering = ["pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["material"],
                condition=~models.Q(material=""),
                name="sales_item_unique_material",
                violation_error_message="Another sales item already has this material",
            ),
        ]

    def __str__(self) -> str:
        return self.name


AuditLogger.register(SalesItem)
