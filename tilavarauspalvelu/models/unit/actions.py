from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Unit


class UnitActions:
    def __init__(self, unit: "Unit") -> None:
        self.unit = unit
