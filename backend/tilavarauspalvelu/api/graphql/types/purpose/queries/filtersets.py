from undine import Filter, FilterSet

from tilavarauspalvelu.models import Purpose

__all__ = [
    "PurposeFilterSet",
]


class PurposeFilterSet(FilterSet[Purpose]):
    pk = Filter(lookup="in")
    name_fi = Filter()
    name_en = Filter()
    name_sv = Filter()
