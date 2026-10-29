from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import EquipmentCategory
from tilavarauspalvelu.models._base import ModelQuerySet, TranslatedModelManager

__all__ = [
    "EquipmentCategoryManager",
    "EquipmentCategoryQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=EquipmentCategory, covariant=True, default=EquipmentCategory)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=EquipmentCategory)


class EquipmentCategoryQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class EquipmentCategoryManager(TranslatedModelManager[EquipmentCategory, EquipmentCategoryQuerySet]): ...
