from factory import fuzzy

from reservation_units.models import ReservationUnitType
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationUnitTypeFactory",
]


class ReservationUnitTypeFactory(GenericDjangoModelFactory[ReservationUnitType]):
    class Meta:
        model = ReservationUnitType

    name = fuzzy.FuzzyText()
