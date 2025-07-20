from __future__ import annotations

from tilavarauspalvelu.models import Equipment
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "EquipmentManager",
    "EquipmentQuerySet",
]


class EquipmentQuerySet(ModelQuerySet[Equipment]): ...


class EquipmentManager(ModelManager[Equipment, EquipmentQuerySet]): ...
