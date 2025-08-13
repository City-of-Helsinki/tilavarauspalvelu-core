from lookup_property import L
from undine import Order, OrderSet

from tilavarauspalvelu.models import AllocatedTimeSlot

__all__ = [
    "AllocatedTimeSlotOrderSet",
]


class AllocatedTimeSlotOrderSet(OrderSet[AllocatedTimeSlot]):
    pk = Order()
    application_section_pk = Order("reservation_unit_option__application_section__pk")
    application_pk = Order("reservation_unit_option__application_section__application__pk")
    application_section_name = Order("reservation_unit_option__application_section__name")
    allocated_unit_name_fi = Order("reservation_unit_option__reservation_unit__unit__name_fi")
    allocated_unit_name_en = Order("reservation_unit_option__reservation_unit__unit__name_en")
    allocated_unit_name_sv = Order("reservation_unit_option__reservation_unit__unit__name_sv")
    allocated_reservation_unit_name_fi = Order("reservation_unit_option__reservation_unit__name_fi")
    allocated_reservation_unit_name_en = Order("reservation_unit_option__reservation_unit__name_en")
    allocated_reservation_unit_name_sv = Order("reservation_unit_option__reservation_unit__name_sv")
    allocated_time_of_week = Order(L("allocated_time_of_week"))
    applicant = Order(L("reservation_unit_option__application_section__application__applicant"))
    application_status = Order(L("reservation_unit_option__application_section__application__status_sort_order"))
    application_section_status = Order(L("reservation_unit_option__application_section__status_sort_order"))
    day_of_the_week = Order(L("day_of_the_week_number"))
