from typing import Any

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

    @classmethod
    def build_for_bulk_create(cls, **kwargs: Any) -> Space:
        """
        Builds a Space object with the MPTT fields set to 0, so that 'bulk_create' works.
        Should call Space.objects.rebuild() after the bulk create to update the MPTT fields.
        """
        kwargs["lft"] = 0
        kwargs["rght"] = 0
        kwargs["tree_id"] = 0
        kwargs["level"] = 0
        return cls.build(**kwargs)
