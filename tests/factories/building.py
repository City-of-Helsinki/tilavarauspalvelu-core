from factory import LazyAttribute

from tilavarauspalvelu.models import Building

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ReverseForeignKeyFactory,
    ReverseOneToOneFactory,
)

__all__ = [
    "BuildingFactory",
]


class BuildingFactory(GenericDjangoModelFactory[Building]):
    class Meta:
        model = Building

    name = FakerFI("company")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("company")
    name_sv = FakerSV("company")

    surface_area = FakerFI("pydecimal", min_value=1, max_value=100)

    real_estate = ForeignKeyFactory("tests.factories.RealEstateFactory")
    location = ReverseOneToOneFactory("tests.factories.LocationFactory")

    spaces = ReverseForeignKeyFactory("tests.factories.SpaceFactory")
