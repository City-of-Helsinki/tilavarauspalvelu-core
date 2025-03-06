from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import EquipmentCategory


__all__ = [
    "EquipmentCategoryValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class EquipmentCategoryValidator:
    equipment_category: EquipmentCategory
