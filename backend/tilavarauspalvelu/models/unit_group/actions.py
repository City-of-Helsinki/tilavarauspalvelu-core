from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import UnitGroup


__all__ = [
    "UnitGroupActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UnitGroupActions:
    unit_group: UnitGroup
