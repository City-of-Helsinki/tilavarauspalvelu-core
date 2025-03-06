from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Location


__all__ = [
    "LocationActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class LocationActions:
    location: Location
