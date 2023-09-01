from factory import fuzzy

from reservation_units.models import Purpose

from ._base import GenericDjangoModelFactory

__all__ = [
    "PurposeFactory",
]


class PurposeFactory(GenericDjangoModelFactory[Purpose]):
    class Meta:
        model = Purpose

    name = fuzzy.FuzzyText()
