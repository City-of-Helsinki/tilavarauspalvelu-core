from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import ReservationUnitCancellationRuleActions
    from .queryset import ReservationUnitCancellationRuleManager
    from .validators import ReservationUnitCancellationRuleValidator

__all__ = [
    "ReservationUnitCancellationRule",
]


class ReservationUnitCancellationRule(models.Model):
    name: str = models.CharField(max_length=255)
    can_be_cancelled_time_before: datetime.timedelta | None = models.DurationField(
        default=datetime.timedelta(hours=24),
        blank=True,
        null=True,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects: ClassVar[ReservationUnitCancellationRuleManager] = LazyModelManager.new()
    actions: ReservationUnitCancellationRuleActions = LazyModelAttribute.new()
    validators: ReservationUnitCancellationRuleValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_cancellation_rule"
        base_manager_name = "objects"
        verbose_name = _("reservation unit cancellation rule")
        verbose_name_plural = _("reservation unit cancellation rules")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
