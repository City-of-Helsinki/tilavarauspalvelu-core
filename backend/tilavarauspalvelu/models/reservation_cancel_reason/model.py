from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import ReservationCancelReasonActions
    from .queryset import ReservationCancelReasonManager
    from .validators import ReservationCancelReasonValidator

__all__ = [
    "ReservationCancelReason",
]


class ReservationCancelReason(models.Model):
    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_en: str | None
    reason_sv: str | None

    objects: ClassVar[ReservationCancelReasonManager] = LazyModelManager.new()
    actions: ReservationCancelReasonActions = LazyModelAttribute.new()
    validators: ReservationCancelReasonValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_cancel_reason"
        base_manager_name = "objects"
        verbose_name = _("reservation cancel reason")
        verbose_name_plural = _("reservation cancel reasons")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.reason
