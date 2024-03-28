from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

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
