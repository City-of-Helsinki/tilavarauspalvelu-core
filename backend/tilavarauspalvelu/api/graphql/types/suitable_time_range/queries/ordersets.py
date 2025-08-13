from undine import Order, OrderSet

from tilavarauspalvelu.models import SuitableTimeRange

__all__ = [
    "SuitableTimeRangeOrderSet",
]


class SuitableTimeRangeOrderSet(OrderSet[SuitableTimeRange]):
    pk = Order()
