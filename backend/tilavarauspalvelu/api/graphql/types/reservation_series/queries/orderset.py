from undine import Order, OrderSet

from tilavarauspalvelu.models import ReservationSeries

__all__ = [
    "ReservationSeriesOrderSet",
]


class ReservationSeriesOrderSet(OrderSet[ReservationSeries]):
    pk = Order()
    name = Order()
    created_at = Order()
    begin_date = Order()
    begin_time = Order()
    end_date = Order()
    end_time = Order()
    reservation_unit_name_fi = Order("reservation_unit__name_fi")
    reservation_unit_name_en = Order("reservation_unit__name_en")
    reservation_unit_name_sv = Order("reservation_unit__name_sv")
    unit_name_fi = Order("reservation_unit__unit__name_fi")
    unit_name_en = Order("reservation_unit__unit__name_en")
    unit_name_sv = Order("reservation_unit__unit__name_sv")
