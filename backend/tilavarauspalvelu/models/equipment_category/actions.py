from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import EquipmentCategory


__all__ = [
    "EquipmentCategoryActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class EquipmentCategoryActions:
    equipment_category: EquipmentCategory
