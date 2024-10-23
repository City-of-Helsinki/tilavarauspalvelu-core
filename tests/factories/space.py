from factory import LazyAttribute

from tilavarauspalvelu.models import Space

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ManyToManyFactory,
    ReverseForeignKeyFactory,
    ReverseOneToOneFactory,
)


class SpaceFactory(GenericDjangoModelFactory[Space]):
    class Meta:
        model = Space
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    surface_area = None  # Decimal
    max_persons = None  # int
    code = FakerFI("word")

    parent = ForeignKeyFactory("tests.factories.SpaceFactory")
    building = ForeignKeyFactory("tests.factories.BuildingFactory")
    unit = ForeignKeyFactory("tests.factories.UnitFactory", required=True)

    location = ReverseOneToOneFactory("tests.factories.LocationFactory")

    resources = ReverseForeignKeyFactory("tests.factories.ResourceFactory")
    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
