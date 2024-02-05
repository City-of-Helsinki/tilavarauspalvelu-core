from factory import fuzzy

from reservation_units.models import ReservationUnitCancellationRule
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationUnitCancellationRuleFactory",
]


class ReservationUnitCancellationRuleFactory(GenericDjangoModelFactory[ReservationUnitCancellationRule]):
    class Meta:
        model = ReservationUnitCancellationRule

    name = fuzzy.FuzzyText()
