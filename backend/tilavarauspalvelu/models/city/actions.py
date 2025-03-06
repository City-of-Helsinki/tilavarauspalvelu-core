from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import City


__all__ = [
    "CityActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class CityActions:
    city: City
