from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import UnitGroup

    from .actions import PriceOptionActions
    from .queryset import PriceOptionManager
    from .validators import PriceOptionValidator


__all__ = [
    "PriceOption",
]


class PriceOption(models.Model):
    name: str = models.CharField(max_length=255)
    description: str = models.TextField(blank=True, default="")
    is_active: bool = models.BooleanField(default=True)

    unit_group: UnitGroup = models.ForeignKey(
        "tilavarauspalvelu.UnitGroup",
        related_name="price_options",
        on_delete=models.PROTECT,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None
    description_fi: str | None
    description_en: str | None
    description_sv: str | None

    objects: ClassVar[PriceOptionManager] = LazyModelManager.new()
    actions: LazyAttribute[PriceOptionActions] = LazyModelAttribute.new()
    validators: LazyAttribute[PriceOptionValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "price_option"
        base_manager_name = "objects"
        verbose_name = _("price option")
        verbose_name_plural = _("price options")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


AuditLogger.register(PriceOption)
