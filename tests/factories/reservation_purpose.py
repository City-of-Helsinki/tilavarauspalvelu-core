from factory import fuzzy

from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.models import ReservationPurpose

__all__ = [
    "ReservationPurposeFactory",
]


class ReservationPurposeFactory(GenericDjangoModelFactory[ReservationPurpose]):
    class Meta:
        model = ReservationPurpose

    name = fuzzy.FuzzyText()
