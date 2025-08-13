from undine import Filter, FilterSet

from tilavarauspalvelu.models import ReservationDenyReason

__all__ = [
    "ReservationDenyReasonFilterSet",
]


class ReservationDenyReasonFilterSet(FilterSet[ReservationDenyReason]):
    pk = Filter(lookup="in")
    reason = Filter()
