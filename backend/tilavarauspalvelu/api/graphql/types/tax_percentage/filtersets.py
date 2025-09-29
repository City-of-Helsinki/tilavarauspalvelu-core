from __future__ import annotations

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import TaxPercentage

__all__ = [
    "TaxPercentageFilterSet",
]


class TaxPercentageFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = TaxPercentage
        fields = [
            "value",
            "is_enabled",
        ]
        order_by = [
            "pk",
            "is_enabled",
        ]
