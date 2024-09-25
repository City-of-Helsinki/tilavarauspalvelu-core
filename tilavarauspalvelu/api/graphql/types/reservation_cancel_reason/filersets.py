from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import ReservationPurpose

__all__ = [
    "ReservationCancelReasonFilterSet",
]


class ReservationCancelReasonFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationPurpose
        fields = [
            "name",
        ]
