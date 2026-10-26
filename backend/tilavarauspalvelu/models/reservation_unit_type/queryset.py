from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationUnitType
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "ReservationUnitTypeManager",
    "ReservationUnitTypeQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservationUnitType, covariant=True, default=ReservationUnitType)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationUnitType)


class ReservationUnitTypeQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationUnitTypeManager(ModelManager[ReservationUnitType, ReservationUnitTypeQuerySet]): ...
