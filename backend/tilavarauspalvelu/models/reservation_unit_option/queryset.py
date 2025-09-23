from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound

__all__ = [
    "ReservationUnitOptionManager",
    "ReservationUnitOptionQuerySet",
]


class ReservationUnitOptionQuerySet(models.QuerySet):
    def for_application_round(self, ref: ApplicationRound | models.OuterRef) -> models.QuerySet:
        """Return all reservation unit options for the given application round."""
        return self.filter(application_section__application__application_round=ref)


class ReservationUnitOptionManager(models.Manager.from_queryset(ReservationUnitOptionQuerySet)): ...
