from lookup_property import L
from undine import Order, OrderSet

from tilavarauspalvelu.models import Reservation


class ReservationOrderSet(OrderSet[Reservation]):
    pk = Order()
    name = Order()
    begins_at = Order()
    ends_at = Order()
    created_at = Order()
    state = Order()
    price = Order()
    reservation_unit_name_fi = Order("reservation_unit__name_fi")
    reservation_unit_name_en = Order("reservation_unit__name_en")
    reservation_unit_name_sv = Order("reservation_unit__name_sv")
    unit_name_fi = Order("reservation_unit__unit__name_fi")
    unit_name_en = Order("reservation_unit__unit__name_en")
    unit_name_sv = Order("reservation_unit__unit__name_sv")
    reservee_name = Order(L("reservee_name"))
    order_status = Order("payment_order__status")
