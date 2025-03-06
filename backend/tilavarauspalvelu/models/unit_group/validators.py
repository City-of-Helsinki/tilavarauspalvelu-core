from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import UnitGroup


__all__ = [
    "UnitGroupValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UnitGroupValidator:
    unit_group: UnitGroup
