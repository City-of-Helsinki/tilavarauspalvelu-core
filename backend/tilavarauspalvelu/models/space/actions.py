from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Space


__all__ = [
    "SpaceActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SpaceActions:
    space: Space
