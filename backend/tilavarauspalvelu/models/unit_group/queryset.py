from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import UnitGroup
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "UnitGroupManager",
    "UnitGroupQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=UnitGroup, covariant=True, default=UnitGroup)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=UnitGroup)


class UnitGroupQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class UnitGroupManager(TranslatedModelManager[UnitGroup, UnitGroupQuerySet]): ...
