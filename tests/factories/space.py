import factory
from factory import fuzzy

from spaces.models import Space

from ._base import GenericDjangoModelFactory


class SpaceFactory(GenericDjangoModelFactory[Space]):
    class Meta:
        model = Space

    name = fuzzy.FuzzyText()
    parent = None
    building = factory.SubFactory("tests.factories.BuildingFactory")
    unit = factory.SubFactory("tests.factories.UnitFactory")
