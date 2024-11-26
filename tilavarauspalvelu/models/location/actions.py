from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Location


class LocationActions:
    def __init__(self, location: Location) -> None:
        self.location = location
