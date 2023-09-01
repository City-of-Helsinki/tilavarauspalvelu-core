import factory
from factory import fuzzy

from applications.models import Person

from ._base import GenericDjangoModelFactory

__all__ = [
    "PersonFactory",
]


class PersonFactory(GenericDjangoModelFactory[Person]):
    class Meta:
        model = Person

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    email = factory.LazyAttribute(lambda o: f"{o.first_name.lower()}.{o.last_name.lower()}@example.com")
    phone_number = fuzzy.FuzzyText(length=7, chars=[str(c) for c in range(10)])
