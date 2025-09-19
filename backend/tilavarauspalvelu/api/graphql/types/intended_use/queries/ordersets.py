from undine import Order, OrderSet

from tilavarauspalvelu.models import IntendedUse

__all__ = [
    "IntendedUseOrderSet",
]


class IntendedUseOrderSet(OrderSet[IntendedUse]):
    pk = Order()
    rank = Order()
    name_fi = Order()
    name_en = Order()
    name_sv = Order()
