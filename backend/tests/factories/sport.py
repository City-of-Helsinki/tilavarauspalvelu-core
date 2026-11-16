from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import Sport

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "SportFactory",
]


class SportFactory(GenericDjangoModelFactory[Sport]):
    class Meta:
        model = Sport

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    application_sections = ReverseForeignKeyFactory("tests.factories.ApplicationSectionFactory")
