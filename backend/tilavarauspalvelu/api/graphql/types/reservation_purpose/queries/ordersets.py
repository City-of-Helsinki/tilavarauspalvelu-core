from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationPurpose

__all__ = [
    "ReservationPurposeOrderSet",
]


class ReservationPurposeOrderSet(OrderSet[ReservationPurpose]):
    pk = Order()
    rank = Order()
    name_fi = Order()
    name_en = Order()
    name_sv = Order()
