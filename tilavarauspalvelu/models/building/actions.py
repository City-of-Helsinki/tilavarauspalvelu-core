from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Building


class BuildingActions:
    def __init__(self, building: Building) -> None:
        self.building = building
