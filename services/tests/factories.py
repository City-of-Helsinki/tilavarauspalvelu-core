from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText


class ServiceFactory(DjangoModelFactory):
    class Meta:
        model = "services.Service"

    name = FuzzyText()
