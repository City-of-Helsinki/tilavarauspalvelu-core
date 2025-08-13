from undine import Filter, FilterSet

from tilavarauspalvelu.models import ReservationUnitCancellationRule

__all__ = [
    "ReservationUnitCancellationRuleFilterSet",
]


class ReservationUnitCancellationRuleFilterSet(FilterSet[ReservationUnitCancellationRule]):
    pk = Filter(lookup="in")
    name = Filter()
