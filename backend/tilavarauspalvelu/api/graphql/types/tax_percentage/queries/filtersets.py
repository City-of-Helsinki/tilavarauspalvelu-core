from undine import Filter, FilterSet

from tilavarauspalvelu.models import TaxPercentage

__all__ = [
    "TaxPercentageFilterSet",
]


class TaxPercentageFilterSet(FilterSet[TaxPercentage]):
    pk = Filter(lookup="in")
    value = Filter()
