from __future__ import annotations

from typing import TYPE_CHECKING, Self

from tilavarauspalvelu.models import ReservationUnitOption
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models import ApplicationRound

__all__ = [
    "ReservationUnitOptionManager",
    "ReservationUnitOptionQuerySet",
]


class ReservationUnitOptionQuerySet(ModelQuerySet[ReservationUnitOption]):
    def for_application_round(self, ref: ApplicationRound | models.OuterRef) -> Self:
        """Return all reservation unit options for the given application round."""
        return self.filter(application_section__application__application_round=ref)


class ReservationUnitOptionManager(ModelManager[ReservationUnitOption, ReservationUnitOptionQuerySet]): ...
