from factory import LazyAttribute

from tilavarauspalvelu.models import Equipment

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "EquipmentFactory",
]


class EquipmentFactory(GenericDjangoModelFactory[Equipment]):
    class Meta:
        model = Equipment

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_sv = FakerSV("word")
    name_en = FakerEN("word")

    category = ForeignKeyFactory("tests.factories.EquipmentCategoryFactory")
    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
