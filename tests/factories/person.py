from __future__ import annotations

from tilavarauspalvelu.models import Person

from ._base import FakerFI, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "PersonFactory",
]


class PersonFactory(GenericDjangoModelFactory[Person]):
    class Meta:
        model = Person

    first_name = FakerFI("first_name")
    last_name = FakerFI("last_name")
    email = FakerFI("email")
    phone_number = FakerFI("phone_number")

    applications = ReverseForeignKeyFactory("tests.factories.ApplicationFactory")
