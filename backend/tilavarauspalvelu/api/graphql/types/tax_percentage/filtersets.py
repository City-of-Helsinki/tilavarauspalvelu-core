from __future__ import annotations

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
        ]
