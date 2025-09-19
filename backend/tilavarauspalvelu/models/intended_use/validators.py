from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import IntendedUse


__all__ = [
    "IntendedUseValidator",
]


@dataclasses.dataclass
class IntendedUseValidator:
    intended_use: IntendedUse
