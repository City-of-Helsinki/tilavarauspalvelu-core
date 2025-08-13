from lookup_property import L
from undine import Order, OrderSet

from tilavarauspalvelu.models import RejectedOccurrence

SECTION_LOOKUP = "reservation_series__allocated_time_slot__reservation_unit_option__application_section"


class RejectedOccurrenceOrderSet(OrderSet[RejectedOccurrence]):
    pk = Order()
    begin_datetime = Order()
    end_datetime = Order()
    rejection_reason = Order(L("rejection_reason_sort_order"))

    application_pk = Order(f"{SECTION_LOOKUP}__application__pk")
    application_section_pk = Order(f"{SECTION_LOOKUP}__pk")
    application_section_name = Order(f"{SECTION_LOOKUP}__name")
    applicant = Order(L(f"{SECTION_LOOKUP}__application__applicant"))

    reservation_unit_pk = Order("reservation_series__reservation_unit__pk")
    reservation_unit_name = Order("reservation_series__reservation_unit__name")
    unit_pk = Order("reservation_series__reservation_unit__unit__pk")
    unit_name = Order("reservation_series__reservation_unit__unit__name")
