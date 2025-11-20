from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitType
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "ReservationUnitTypeManager",
    "ReservationUnitTypeQuerySet",
]


class ReservationUnitTypeQuerySet(TranslatedModelQuerySet[ReservationUnitType]): ...


class ReservationUnitTypeManager(ModelManager[ReservationUnitType, ReservationUnitTypeQuerySet]): ...
