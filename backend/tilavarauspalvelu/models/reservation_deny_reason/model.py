from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import ReservationDenyReasonActions
    from .queryset import ReservationDenyReasonManager
    from .validators import ReservationDenyReasonValidator


__all__ = [
    "ReservationDenyReason",
]


class ReservationDenyReason(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_sv: str | None
    reason_en: str | None

    objects: ClassVar[ReservationDenyReasonManager] = LazyModelManager.new()
    actions: ReservationDenyReasonActions = LazyModelAttribute.new()
    validators: ReservationDenyReasonValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_deny_reason"
        base_manager_name = "objects"
        verbose_name = _("reservation deny reason")
        verbose_name_plural = _("reservation deny reasons")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.reason
