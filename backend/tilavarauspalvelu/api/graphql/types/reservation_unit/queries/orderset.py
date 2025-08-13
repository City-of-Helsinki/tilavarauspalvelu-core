from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationUnit

__all__ = [
    "ReservationUnitAllOrderSet",
    "ReservationUnitOrderSet",
]


class ReservationUnitOrderSet(OrderSet[ReservationUnit]):
    pk = Order()
    rank = Order()
    name_fi = Order()
    name_en = Order()
    name_sv = Order()
    max_persons = Order()
    surface_area = Order()
    type_fi = Order("reservation_unit_type__name_fi")
    type_en = Order("reservation_unit_type__name_en")
    type_sv = Order("reservation_unit_type__name_sv")
    type_rank = Order("reservation_unit_type__rank")
    unit_name_fi = Order("unit__name_fi")
    unit_name_en = Order("unit__name_en")
    unit_name_sv = Order("unit__name_sv")


class ReservationUnitAllOrderSet(OrderSet[ReservationUnit]):
    pk = Order()
    rank = Order()
    name_fi = Order()
    name_en = Order()
    name_sv = Order()
