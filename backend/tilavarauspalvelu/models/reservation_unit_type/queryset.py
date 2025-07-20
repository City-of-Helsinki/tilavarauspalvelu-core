from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitType
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitTypeManager",
    "ReservationUnitTypeQuerySet",
]


class ReservationUnitTypeQuerySet(ModelQuerySet[ReservationUnitType]): ...


class ReservationUnitTypeManager(ModelManager[ReservationUnitType, ReservationUnitTypeQuerySet]): ...
