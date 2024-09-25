from factory import fuzzy

from tilavarauspalvelu.models import Qualifier

from ._base import GenericDjangoModelFactory

__all__ = [
    "QualifierFactory",
]


class QualifierFactory(GenericDjangoModelFactory[Qualifier]):
    class Meta:
        model = Qualifier

    name = fuzzy.FuzzyText()
