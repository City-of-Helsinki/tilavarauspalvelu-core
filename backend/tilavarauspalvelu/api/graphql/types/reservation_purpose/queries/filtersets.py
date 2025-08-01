from undine import Filter, FilterSet

from tilavarauspalvelu.models import ReservationPurpose

__all__ = [
    "ReservationPurposeFilterSet",
]


class ReservationPurposeFilterSet(FilterSet[ReservationPurpose]):
    pk = Filter(lookup="in")
    name_fi = Filter()
    name_en = Filter()
    name_sv = Filter()
