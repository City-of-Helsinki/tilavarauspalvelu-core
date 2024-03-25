from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from reservations.models import ReservationDenyReason

__all__ = [
    "ReservationDenyReasonFilterSet",
]


class ReservationDenyReasonFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationDenyReason
        fields = [
            "reason",
        ]
