from undine import Order, OrderSet

from tilavarauspalvelu.models import UnitGroup

__all__ = [
    "UnitGroupOrderSet",
]


class UnitGroupOrderSet(OrderSet[UnitGroup]):
    pk = Order()

    name_fi = Order()
    name_en = Order()
    name_sv = Order()
