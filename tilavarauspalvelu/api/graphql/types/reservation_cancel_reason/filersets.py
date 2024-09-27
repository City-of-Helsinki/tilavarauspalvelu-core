from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import ReservationCancelReason

__all__ = [
    "ReservationCancelReasonFilterSet",
]


class ReservationCancelReasonFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationCancelReason
        fields = [
            "reason",
        ]
