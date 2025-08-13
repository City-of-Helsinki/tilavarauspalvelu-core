from undine import Order, OrderSet

from tilavarauspalvelu.models import Resource

__all__ = [
    "ResourceOrderSet",
]


class ResourceOrderSet(OrderSet[Resource]):
    pk = Order()
    name = Order()
    location_type = Order()
    space = Order()
