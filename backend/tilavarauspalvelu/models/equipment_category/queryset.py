from __future__ import annotations

from tilavarauspalvelu.models import EquipmentCategory
from tilavarauspalvelu.models._base import ModelQuerySet, TranslatedModelManager

__all__ = [
    "EquipmentCategoryManager",
    "EquipmentCategoryQuerySet",
]


class EquipmentCategoryQuerySet(ModelQuerySet[EquipmentCategory]): ...


class EquipmentCategoryManager(TranslatedModelManager[EquipmentCategory, EquipmentCategoryQuerySet]): ...
