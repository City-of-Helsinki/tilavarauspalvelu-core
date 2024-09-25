from factory import fuzzy

from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.models import ReservationUnitType

__all__ = [
    "ReservationUnitTypeFactory",
]


class ReservationUnitTypeFactory(GenericDjangoModelFactory[ReservationUnitType]):
    class Meta:
        model = ReservationUnitType

    name = fuzzy.FuzzyText()
