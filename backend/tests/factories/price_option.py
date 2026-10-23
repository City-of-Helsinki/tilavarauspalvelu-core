from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import PriceOption

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "PriceOptionFactory",
]


class PriceOptionFactory(GenericDjangoModelFactory[PriceOption]):
    class Meta:
        model = PriceOption

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    description = ""
    is_active = True

    unit_group = ForeignKeyFactory("tests.factories.UnitGroupFactory", required=True)
