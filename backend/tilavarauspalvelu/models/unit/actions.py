from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Unit


__all__ = [
    "UnitActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UnitActions:
    unit: Unit
