from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import Equipment
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "EquipmentManager",
    "EquipmentQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=Equipment, covariant=True, default=Equipment)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=Equipment)


class EquipmentQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class EquipmentManager(TranslatedModelManager[Equipment, EquipmentQuerySet]): ...
