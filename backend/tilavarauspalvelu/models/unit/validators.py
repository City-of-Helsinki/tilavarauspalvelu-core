from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Unit


__all__ = [
    "UnitValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UnitValidator:
    unit: Unit
