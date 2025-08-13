from undine import Order, OrderSet

from tilavarauspalvelu.models import Purpose

__all__ = [
    "PurposeOrderSet",
]


class PurposeOrderSet(OrderSet[Purpose]):
    pk = Order()
    rank = Order()
    name_fi = Order()
    name_en = Order()
    name_sv = Order()
