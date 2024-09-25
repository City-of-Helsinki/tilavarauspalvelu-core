from factory import fuzzy

from tilavarauspalvelu.models import Purpose

from ._base import GenericDjangoModelFactory

__all__ = [
    "PurposeFactory",
]


class PurposeFactory(GenericDjangoModelFactory[Purpose]):
    class Meta:
        model = Purpose

    name = fuzzy.FuzzyText()
