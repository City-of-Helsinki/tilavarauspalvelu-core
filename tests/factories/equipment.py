from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import Equipment

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "EquipmentFactory",
]


class EquipmentFactory(GenericDjangoModelFactory[Equipment]):
    class Meta:
        model = Equipment

    name = FakerFI("job")
    name_fi = LazyAttribute(lambda i: i.name)
    name_sv = FakerSV("job")
    name_en = FakerEN("job")

    category = ForeignKeyFactory("tests.factories.EquipmentCategoryFactory")
    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
