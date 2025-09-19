from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import IntendedUse


__all__ = [
    "IntendedUseActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class IntendedUseActions:
    intended_use: IntendedUse
