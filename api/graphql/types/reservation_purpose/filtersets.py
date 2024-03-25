from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from reservations.models import ReservationPurpose

__all__ = [
    "ReservationPurposeFilterSet",
]


class ReservationPurposeFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationPurpose
        fields = [
            "name_fi",
            "name_en",
            "name_sv",
        ]
