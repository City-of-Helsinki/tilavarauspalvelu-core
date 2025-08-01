from undine import Order, OrderSet

from tilavarauspalvelu.models import Space

__all__ = [
    "SpaceOrderSet",
]


class SpaceOrderSet(OrderSet[Space]):
    pk = Order()
