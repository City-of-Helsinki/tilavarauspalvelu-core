from undine import Filter, FilterSet

from tilavarauspalvelu.models import IntendedUse

__all__ = [
    "IntendedUseFilterSet",
]


class IntendedUseFilterSet(FilterSet[IntendedUse]):
    pk = Filter(lookup="in")
    name_fi = Filter()
    name_en = Filter()
    name_sv = Filter()
