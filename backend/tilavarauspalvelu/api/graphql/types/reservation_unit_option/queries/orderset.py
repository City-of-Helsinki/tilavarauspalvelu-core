from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationUnitOption

__all__ = [
    "ReservationUnitOptionOrderSet",
]


class ReservationUnitOptionOrderSet(OrderSet[ReservationUnitOption]):
    pk = Order()
