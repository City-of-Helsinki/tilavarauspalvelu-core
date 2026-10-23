from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    import datetime

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import PricingGroup, ReservationUnit

    from .actions import ReservationUnitPricingGroupActions
    from .queryset import ReservationUnitPricingGroupManager
    from .validators import ReservationUnitPricingGroupValidator


__all__ = [
    "ReservationUnitPricingGroup",
]


class ReservationUnitPricingGroup(models.Model):
    """The pricing group that a reservation unit uses from the `begins` date onward."""

    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_unit_pricing_groups",
        on_delete=models.CASCADE,
    )
    pricing_group: PricingGroup = models.ForeignKey(
        "tilavarauspalvelu.PricingGroup",
        related_name="reservation_unit_pricing_groups",
        on_delete=models.PROTECT,
    )
    begins: datetime.date = models.DateField()

    objects: ClassVar[ReservationUnitPricingGroupManager] = LazyModelManager.new()
    actions: LazyAttribute[ReservationUnitPricingGroupActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ReservationUnitPricingGroupValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_pricing_group"
        base_manager_name = "objects"
        verbose_name = _("reservation unit pricing group")
        verbose_name_plural = _("reservation unit pricing groups")
        ordering = ["reservation_unit", "begins"]
        constraints = [
            models.UniqueConstraint(
                name="reservation_unit_pricing_group_begins_unique",
                fields=["reservation_unit", "begins"],
                violation_error_message="Reservation unit already has a pricing group that begins on this date.",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.reservation_unit_id}: {self.pricing_group_id} from {self.begins}"


AuditLogger.register(ReservationUnitPricingGroup)
