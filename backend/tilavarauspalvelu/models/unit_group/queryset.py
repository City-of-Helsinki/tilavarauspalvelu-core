from __future__ import annotations

from tilavarauspalvelu.models import UnitGroup
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "UnitGroupManager",
    "UnitGroupQuerySet",
]


class UnitGroupQuerySet(TranslatedModelQuerySet[UnitGroup]): ...


class UnitGroupManager(ModelManager[UnitGroup, UnitGroupQuerySet]): ...
