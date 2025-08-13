from undine import Order, OrderSet

from tilavarauspalvelu.models import EquipmentCategory

__all__ = [
    "EquipmentCategoryOrderSet",
]


class EquipmentCategoryOrderSet(OrderSet[EquipmentCategory]):
    pk = Order()
