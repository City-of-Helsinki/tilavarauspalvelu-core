from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from reservation_units.models import ReservationUnitCancellationRule

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
