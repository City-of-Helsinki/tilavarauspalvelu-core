from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import Address

from ._base import FakerFI, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "AddressFactory",
]


class AddressFactory(GenericDjangoModelFactory[Address]):
    class Meta:
        model = Address
        django_get_or_create = ["street_address", "post_code", "city"]

    street_address = FakerFI("address", unique=True)
    street_address_fi = LazyAttribute(lambda i: i.street_address)
    street_address_en = LazyAttribute(lambda i: i.street_address)
    street_address_sv = LazyAttribute(lambda i: i.street_address)

    post_code = FakerFI("postcode")

    city = "Helsinki"
    city_fi = LazyAttribute(lambda i: i.city)
    city_en = "Helsinki"
    city_sv = "Helsingfors"

    applications = ReverseForeignKeyFactory("tests.factories.ApplicationFactory")
    organisations = ReverseForeignKeyFactory("tests.factories.OrganisationFactory")
