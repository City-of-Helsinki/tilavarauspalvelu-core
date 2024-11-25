from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import RealEstate

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    GenericDjangoModelFactory,
    ReverseForeignKeyFactory,
    ReverseOneToOneFactory,
)

__all__ = [
    "RealEstateFactory",
]


class RealEstateFactory(GenericDjangoModelFactory[RealEstate]):
    class Meta:
        model = RealEstate

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    surface_area = FakerFI("pydecimal", min_value=1, max_value=100)

    buildings = ReverseForeignKeyFactory("tests.factories.BuildingFactory")
    location = ReverseOneToOneFactory("tests.factories.LocationFactory")
