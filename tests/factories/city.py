from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import City

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "CityFactory",
]


class CityFactory(GenericDjangoModelFactory[City]):
    class Meta:
        model = City
        django_get_or_create = ["name"]

    name = FakerFI("city", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("city")
    name_sv = FakerSV("city")

    municipality_code = ""

    applications = ReverseForeignKeyFactory("tests.factories.ApplicationFactory")
    reservations = ReverseForeignKeyFactory("tests.factories.ReservationSetFactory")
