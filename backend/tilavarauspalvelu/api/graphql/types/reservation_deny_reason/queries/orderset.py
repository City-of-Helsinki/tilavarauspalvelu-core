from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationDenyReason

__all__ = [
    "ReservationDenyReasonOrderSet",
]


class ReservationDenyReasonOrderSet(OrderSet[ReservationDenyReason]):
    pk = Order()
    reason = Order()
    rank = Order()
