from __future__ import annotations

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import TaxLevel

__all__ = [
    "TaxLevelFilterSet",
]


class TaxLevelFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = TaxLevel
        fields = []
        order_by = [
            "pk",
        ]
