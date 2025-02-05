from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import UnitGroup

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "UnitGroupFactory",
]


class UnitGroupFactory(GenericDjangoModelFactory[UnitGroup]):
    class Meta:
        model = UnitGroup
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    units = ManyToManyFactory("tests.factories.UnitFactory")
    unit_roles = ManyToManyFactory("tests.factories.UnitRoleFactory")
