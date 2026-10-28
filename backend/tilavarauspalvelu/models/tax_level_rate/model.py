from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import TaxLevel

    from .actions import TaxLevelRateActions
    from .queryset import TaxLevelRateManager
    from .validators import TaxLevelRateValidator

__all__ = [
    "TaxLevelRate",
]


class TaxLevelRate(models.Model):
    tax_level: TaxLevel = models.ForeignKey(
        "tilavarauspalvelu.TaxLevel",
        related_name="rates",
        on_delete=models.CASCADE,
    )
    begins: datetime.date = models.DateField()
    percentage: Decimal = models.DecimalField(max_digits=5, decimal_places=2)

    objects: ClassVar[TaxLevelRateManager] = LazyModelManager.new()
    actions: LazyAttribute[TaxLevelRateActions] = LazyModelAttribute.new()
    validators: LazyAttribute[TaxLevelRateValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "tax_level_rate"
        base_manager_name = "objects"
        verbose_name = _("tax level rate")
        verbose_name_plural = _("tax level rates")
        ordering = ["tax_level", "begins"]
        constraints = [
            models.UniqueConstraint(
                name="single_rate_per_day_per_tax_level",
                fields=["tax_level", "begins"],
                violation_error_message=_("Rate already exists for this tax level and date"),
            ),
            models.CheckConstraint(
                name="tax_level_rate_percentage_between_0_and_100",
                condition=models.Q(percentage__gte=0, percentage__lte=100),
                violation_error_message=_("Percentage must be between 0 and 100"),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.percentage}% from {self.begins.isoformat()}"


AuditLogger.register(TaxLevelRate)
