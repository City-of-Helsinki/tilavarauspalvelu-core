from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import UnitGroup


class UnitGroupActions:
    def __init__(self, unit_group: "UnitGroup") -> None:
        self.unit_group = unit_group
