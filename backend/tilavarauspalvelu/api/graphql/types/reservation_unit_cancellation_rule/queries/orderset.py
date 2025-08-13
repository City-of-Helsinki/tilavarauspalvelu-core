from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationUnitCancellationRule

__all__ = [
    "ReservationUnitCancellationRuleOrderSet",
]


class ReservationUnitCancellationRuleOrderSet(OrderSet[ReservationUnitCancellationRule]):
    pk = Order()
