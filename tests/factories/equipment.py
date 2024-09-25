import factory
from factory import fuzzy

from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.models import Equipment, EquipmentCategory

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
