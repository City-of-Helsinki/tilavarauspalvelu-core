import factory
from factory import fuzzy

from reservation_units.models import Equipment, EquipmentCategory

from ._base import GenericDjangoModelFactory

__all__ = [
    "EquipmentCategoryFactory",
    "EquipmentFactory",
]


class EquipmentCategoryFactory(GenericDjangoModelFactory[EquipmentCategory]):
    class Meta:
        model = EquipmentCategory

    name = fuzzy.FuzzyText()


class EquipmentFactory(GenericDjangoModelFactory[Equipment]):
    class Meta:
        model = Equipment

    name = fuzzy.FuzzyText()
    category = factory.SubFactory("tests.factories.EquipmentCategoryFactory")
