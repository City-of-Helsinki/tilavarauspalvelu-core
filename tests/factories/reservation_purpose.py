from factory import fuzzy

from reservations.models import ReservationPurpose
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationPurposeFactory",
]


class ReservationPurposeFactory(GenericDjangoModelFactory[ReservationPurpose]):
    class Meta:
        model = ReservationPurpose

    name = fuzzy.FuzzyText()
