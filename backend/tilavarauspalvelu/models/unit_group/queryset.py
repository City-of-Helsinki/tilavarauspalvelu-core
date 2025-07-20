from __future__ import annotations

from tilavarauspalvelu.models import UnitGroup
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "UnitGroupManager",
    "UnitGroupQuerySet",
]


class UnitGroupQuerySet(ModelQuerySet[UnitGroup]): ...


class UnitGroupManager(ModelManager[UnitGroup, UnitGroupQuerySet]): ...
