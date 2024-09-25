from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import EquipmentCategory


class EquipmentCategoryActions:
    def __init__(self, equipment_category: "EquipmentCategory") -> None:
        self.equipment_category = equipment_category
