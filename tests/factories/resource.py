import factory
from factory import fuzzy

from resources.models import Resource

from ._base import GenericDjangoModelFactory

__all__ = [
    "ResourceFactory",
]


class ResourceFactory(GenericDjangoModelFactory[Resource]):
    class Meta:
        model = Resource

    name = fuzzy.FuzzyText()
    space = factory.SubFactory("tests.factories.SpaceFactory")
    location_type = "fixed"
