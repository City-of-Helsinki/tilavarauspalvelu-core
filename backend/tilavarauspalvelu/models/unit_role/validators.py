from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import UnitRole


__all__ = [
    "UnitRoleValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UnitRoleValidator:
    unit_role: UnitRole
