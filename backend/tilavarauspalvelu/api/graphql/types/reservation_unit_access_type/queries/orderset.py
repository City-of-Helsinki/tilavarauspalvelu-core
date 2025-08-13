from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationUnitAccessType

__all__ = [
    "ReservationUnitAccessTypeOrderSet",
]


class ReservationUnitAccessTypeOrderSet(OrderSet[ReservationUnitAccessType]):
    pk = Order()
    begin_date = Order()
