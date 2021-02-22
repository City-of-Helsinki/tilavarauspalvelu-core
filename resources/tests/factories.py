from factory import SubFactory
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText

from spaces.tests.factories import SpaceFactory


class ResourceFactory(DjangoModelFactory):
    class Meta:
        model = "resources.Resource"

    name = FuzzyText()
    space = SubFactory(SpaceFactory)
