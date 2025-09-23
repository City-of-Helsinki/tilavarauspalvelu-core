from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields.model import StrChoiceField

from tilavarauspalvelu.enums import RejectionReadinessChoice
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import ReservationSeries

    from .actions import RejectedOccurrenceActions
    from .queryset import RejectedOccurrenceManager
    from .validators import RejectedOccurrenceValidator


__all__ = [
    "RejectedOccurrence",
]


class RejectedOccurrence(models.Model):
    begin_datetime: datetime.datetime = models.DateTimeField()
    end_datetime: datetime.datetime = models.DateTimeField()
    rejection_reason: str = StrChoiceField(enum=RejectionReadinessChoice)
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)

    reservation_series: ReservationSeries = models.ForeignKey(
        "tilavarauspalvelu.ReservationSeries",
        related_name="rejected_occurrences",
        on_delete=models.CASCADE,
    )

    objects: ClassVar[RejectedOccurrenceManager] = LazyModelManager.new()
    actions: RejectedOccurrenceActions = LazyModelAttribute.new()
    validators: RejectedOccurrenceValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "rejected_occurrence"
        base_manager_name = "objects"
        verbose_name = _("rejected occurrence")
        verbose_name_plural = _("rejected occurrences")
        ordering = [
            "begin_datetime",
            "end_datetime",
        ]

    def __str__(self) -> str:
        return _("rejected occurrence") + f" ({self.begin_datetime.isoformat()} - {self.end_datetime.isoformat()})"
