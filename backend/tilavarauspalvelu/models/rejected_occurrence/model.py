from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import lookup_property

from tilavarauspalvelu.enums import RejectionReadinessChoice
from utils.fields.model import TextChoicesField

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
    rejection_reason: RejectionReadinessChoice = TextChoicesField(choices_enum=RejectionReadinessChoice)
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

    @lookup_property
    def rejection_reason_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(
                rejection_reason=models.Value(RejectionReadinessChoice.INTERVAL_NOT_ALLOWED.value),
                then=models.Value(0),
            ),
            models.When(
                rejection_reason=models.Value(RejectionReadinessChoice.OVERLAPPING_RESERVATIONS.value),
                then=models.Value(1),
            ),
            models.When(
                rejection_reason=models.Value(RejectionReadinessChoice.RESERVATION_UNIT_CLOSED.value),
                then=models.Value(2),
            ),
            default=models.Value(3),
            output_field=models.IntegerField(),
        )
