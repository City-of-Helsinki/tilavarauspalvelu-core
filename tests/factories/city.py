from factory import fuzzy

from tilavarauspalvelu.models import City

from ._base import GenericDjangoModelFactory

__all__ = [
    "CityFactory",
]


class CityFactory(GenericDjangoModelFactory[City]):
    class Meta:
        model = City

    name = fuzzy.FuzzyText(length=20)
