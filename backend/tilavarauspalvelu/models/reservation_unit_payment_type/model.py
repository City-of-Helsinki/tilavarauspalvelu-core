from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import ReservationUnitPaymentTypeActions
    from .queryset import ReservationUnitPaymentTypeManager
    from .validators import ReservationUnitPaymentTypeValidator

__all__ = [
    "ReservationUnitPaymentType",
]


class ReservationUnitPaymentType(models.Model):
    code: str = models.CharField(max_length=32, primary_key=True)

    objects: ClassVar[ReservationUnitPaymentTypeManager] = LazyModelManager.new()
    actions: ReservationUnitPaymentTypeActions = LazyModelAttribute.new()
    validators: ReservationUnitPaymentTypeValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_payment_type"
        base_manager_name = "objects"
        verbose_name = _("reservation unit payment type")
        verbose_name_plural = _("reservation unit payment types")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.code
