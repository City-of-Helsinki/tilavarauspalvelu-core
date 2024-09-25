from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import IntroductionQuerySet

if TYPE_CHECKING:
    from .actions import IntroductionActions

__all__ = [
    "Introduction",
]


class Introduction(models.Model):
    user = models.ForeignKey(
        "tilavarauspalvelu.User",
        on_delete=models.SET_NULL,
        null=True,
    )
    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        on_delete=models.CASCADE,
    )

    completed_at = models.DateTimeField()

    objects = IntroductionQuerySet.as_manager()

    class Meta:
        db_table = "introduction"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"Introduction - {self.user}, {self.reservation_unit} ({self.completed_at})"

    @cached_property
    def actions(self) -> IntroductionActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import IntroductionActions

        return IntroductionActions(self)
