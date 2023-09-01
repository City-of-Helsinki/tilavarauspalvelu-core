from factory import fuzzy

from applications.models import Address

from ._base import GenericDjangoModelFactory

__all__ = [
    "AddressFactory",
]


class AddressFactory(GenericDjangoModelFactory[Address]):
    class Meta:
        model = Address

    street_address = fuzzy.FuzzyText()
    post_code = fuzzy.FuzzyText(length=5)
    city = "Helsinki"
