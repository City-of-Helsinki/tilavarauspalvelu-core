from __future__ import annotations

from tilavarauspalvelu.models import EquipmentCategory
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "EquipmentCategoryManager",
    "EquipmentCategoryQuerySet",
]


class EquipmentCategoryQuerySet(ModelQuerySet[EquipmentCategory]): ...


class EquipmentCategoryManager(ModelManager[EquipmentCategory, EquipmentCategoryQuerySet]): ...
