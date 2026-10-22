from __future__ import annotations

from tilavarauspalvelu.models import Equipment
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "EquipmentManager",
    "EquipmentQuerySet",
]


class EquipmentQuerySet(TranslatedModelQuerySet[Equipment]): ...


class EquipmentManager(TranslatedModelManager[Equipment, EquipmentQuerySet]): ...
