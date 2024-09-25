from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Equipment


class EquipmentActions:
    def __init__(self, equipment: "Equipment") -> None:
        self.equipment = equipment
