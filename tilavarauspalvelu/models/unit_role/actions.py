from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import UnitRole


class UnitRoleActions:
    def __init__(self, unit_role: "UnitRole") -> None:
        self.unit_role = unit_role
