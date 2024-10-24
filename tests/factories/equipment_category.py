import factory
from factory import LazyAttribute

from tilavarauspalvelu.models import EquipmentCategory

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "EquipmentCategoryFactory",
]


class EquipmentCategoryFactory(GenericDjangoModelFactory[EquipmentCategory]):
    class Meta:
        model = EquipmentCategory

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_sv = FakerSV("word")
    name_en = FakerEN("word")

    rank = factory.Sequence(lambda i: i)

    category = ReverseForeignKeyFactory("tests.factories.EquipmentFactory")
