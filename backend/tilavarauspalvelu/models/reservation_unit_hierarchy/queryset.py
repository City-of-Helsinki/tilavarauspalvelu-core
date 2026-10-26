from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationUnitHierarchy
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitHierarchyManager",
    "ReservationUnitHierarchyQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservationUnitHierarchy, covariant=True, default=ReservationUnitHierarchy)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationUnitHierarchy)


class ReservationUnitHierarchyQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationUnitHierarchyManager(ModelManager[ReservationUnitHierarchy, ReservationUnitHierarchyQuerySet]): ...
