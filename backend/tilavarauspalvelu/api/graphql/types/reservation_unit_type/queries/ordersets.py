from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationUnitType

__all__ = [
    "ReservationUnitTypeOrderSet",
]


class ReservationUnitTypeOrderSet(OrderSet[ReservationUnitType]):
    pk = Order()
    rank = Order()

    name_fi = Order()
    name_sv = Order()
    name_en = Order()
