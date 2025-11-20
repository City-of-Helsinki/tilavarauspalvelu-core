from __future__ import annotations

from tilavarauspalvelu.models import Equipment
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "EquipmentManager",
    "EquipmentQuerySet",
]


class EquipmentQuerySet(TranslatedModelQuerySet[Equipment]): ...


class EquipmentManager(ModelManager[Equipment, EquipmentQuerySet]): ...
