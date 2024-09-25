from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields.model import StrChoiceField

from tilavarauspalvelu.enums import RejectionReadinessChoice

from .queryset import RejectedOccurrenceQuerySet

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import RecurringReservation

    from .actions import RejectedOccurrenceActions


__all__ = [
    "RejectedOccurrence",
]


class RejectedOccurrence(models.Model):
    begin_datetime: datetime.datetime = models.DateTimeField()
    end_datetime: datetime.datetime = models.DateTimeField()
    rejection_reason: str = StrChoiceField(enum=RejectionReadinessChoice)
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)

    recurring_reservation: RecurringReservation = models.ForeignKey(
        "tilavarauspalvelu.RecurringReservation",
        on_delete=models.CASCADE,
        related_name="rejected_occurrences",
    )

    objects = RejectedOccurrenceQuerySet.as_manager()

    class Meta:
        db_table = "rejected_occurrence"
        base_manager_name = "objects"
        verbose_name = _("Rejected occurrence")
        verbose_name_plural = _("Rejected occurrences")
        ordering = [
            "begin_datetime",
            "end_datetime",
        ]

    def __str__(self) -> str:
        return f"{_("Rejected occurrence")} ({self.begin_datetime.isoformat()} - {self.end_datetime.isoformat()})"

    @cached_property
    def actions(self) -> RejectedOccurrenceActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import RejectedOccurrenceActions

        return RejectedOccurrenceActions(self)
