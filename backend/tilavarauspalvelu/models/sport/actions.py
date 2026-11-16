from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Sport


__all__ = [
    "SportActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SportActions:
    sport: Sport
