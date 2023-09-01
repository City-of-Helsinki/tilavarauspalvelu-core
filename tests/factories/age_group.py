from factory import fuzzy

from reservations.models import AgeGroup

from ._base import GenericDjangoModelFactory

__all__ = [
    "AgeGroupFactory",
]


class AgeGroupFactory(GenericDjangoModelFactory[AgeGroup]):
    class Meta:
        model = AgeGroup

    minimum = fuzzy.FuzzyInteger(low=0, high=100)
    maximum = fuzzy.FuzzyInteger(low=0, high=100)
