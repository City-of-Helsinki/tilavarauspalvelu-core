from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import UnitRole


__all__ = [
    "UnitRoleActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UnitRoleActions:
    unit_role: UnitRole
