from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitHierarchy
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitHierarchyManager",
    "ReservationUnitHierarchyQuerySet",
]


class ReservationUnitHierarchyQuerySet(ModelQuerySet[ReservationUnitHierarchy]): ...


class ReservationUnitHierarchyManager(ModelManager[ReservationUnitHierarchy, ReservationUnitHierarchyQuerySet]): ...
