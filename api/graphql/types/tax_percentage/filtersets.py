from graphene_django_extensions import ModelFilterSet

from common.filtersets import IntMultipleChoiceFilter
from reservation_units.models import TaxPercentage

__all__ = [
    "TaxPercentageFilterSet",
]


class TaxPercentageFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = TaxPercentage
        fields = [
            "value",
        ]
