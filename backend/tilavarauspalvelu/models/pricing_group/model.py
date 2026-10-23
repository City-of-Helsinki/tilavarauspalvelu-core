from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import PriceComponent, ReservationUnitPricingGroup, UnitGroup
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.price_component.queryset import PriceComponentQuerySet
    from tilavarauspalvelu.models.reservation_unit_pricing_group.queryset import ReservationUnitPricingGroupQuerySet

    from .actions import PricingGroupActions
    from .queryset import PricingGroupManager
    from .validators import PricingGroupValidator


__all__ = [
    "PricingGroup",
]


class PricingGroup(models.Model):
    name: str = models.CharField(max_length=255)

    # A group with a unit group is shared between reservation units.
    # A group without one is the own pricing of the reservation unit that uses it.
    unit_group: UnitGroup | None = models.ForeignKey(
        "tilavarauspalvelu.UnitGroup",
        related_name="pricing_groups",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects: ClassVar[PricingGroupManager] = LazyModelManager.new()
    actions: LazyAttribute[PricingGroupActions] = LazyModelAttribute.new()
    validators: LazyAttribute[PricingGroupValidator] = LazyModelAttribute.new()

    components: OneToManyRelatedManager[PriceComponent, PriceComponentQuerySet]
    reservation_unit_pricing_groups: OneToManyRelatedManager[
        ReservationUnitPricingGroup, ReservationUnitPricingGroupQuerySet
    ]

    class Meta:
        db_table = "pricing_group"
        base_manager_name = "objects"
        verbose_name = _("pricing group")
        verbose_name_plural = _("pricing groups")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name


AuditLogger.register(PricingGroup)
