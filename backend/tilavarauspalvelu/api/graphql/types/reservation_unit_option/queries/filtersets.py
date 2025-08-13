from undine import Filter, FilterSet

from tilavarauspalvelu.models import ReservationUnitOption

__all__ = [
    "ReservationUnitOptionFilterSet",
]


class ReservationUnitOptionFilterSet(FilterSet[ReservationUnitOption]):
    pk = Filter(lookup="in")
    reservation_unit = Filter(lookup="in")
    preferred_order = Filter(lookup="in")
