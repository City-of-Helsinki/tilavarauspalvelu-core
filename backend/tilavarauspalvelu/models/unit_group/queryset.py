from __future__ import annotations

from tilavarauspalvelu.models import UnitGroup
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "UnitGroupManager",
    "UnitGroupQuerySet",
]


class UnitGroupQuerySet(TranslatedModelQuerySet[UnitGroup]): ...


class UnitGroupManager(TranslatedModelManager[UnitGroup, UnitGroupQuerySet]): ...
