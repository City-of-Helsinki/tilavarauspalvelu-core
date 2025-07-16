from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitCancellationRule

__all__ = [
    "ReservationUnitCancellationRuleFilterSet",
]


class ReservationUnitCancellationRuleFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationUnitCancellationRule
        fields = [
            "name",
        ]
