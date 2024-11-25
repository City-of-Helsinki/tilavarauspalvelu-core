from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ResourceFactory",
]


class ResourceFactory(GenericDjangoModelFactory[Resource]):
    class Meta:
        model = Resource
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    location_type = ResourceLocationType.FIXED
    buffer_time_before = None
    buffer_time_after = None

    space = ForeignKeyFactory("tests.factories.SpaceFactory", required=True)

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
