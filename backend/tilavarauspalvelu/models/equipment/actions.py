from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Equipment


__all__ = [
    "EquipmentActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class EquipmentActions:
    equipment: Equipment
