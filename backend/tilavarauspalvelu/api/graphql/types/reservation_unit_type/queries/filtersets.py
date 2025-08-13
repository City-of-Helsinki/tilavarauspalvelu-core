from undine import Filter, FilterSet

from tilavarauspalvelu.models import ReservationUnitType

__all__ = [
    "ReservationUnitTypeFilterSet",
]


class ReservationUnitTypeFilterSet(FilterSet[ReservationUnitType]):
    pk = Filter(lookup="in")

    name_fi_exact = Filter("name_fi", lookup="iexact")
    name_sv_exact = Filter("name_sv", lookup="iexact")
    name_en_exact = Filter("name_en", lookup="iexact")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_sv_contains = Filter("name_sv", lookup="icontains")
    name_en_contains = Filter("name_en", lookup="icontains")

    name_fi_istartswith = Filter("name_fi", lookup="istartswith")
    name_sv_istartswith = Filter("name_sv", lookup="istartswith")
    name_en_istartswith = Filter("name_en", lookup="istartswith")
