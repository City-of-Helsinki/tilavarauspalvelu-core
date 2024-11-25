from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import ServiceSector

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "ServiceSectorFactory",
]


class ServiceSectorFactory(GenericDjangoModelFactory[ServiceSector]):
    class Meta:
        model = ServiceSector
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    units = ManyToManyFactory("tests.factories.UnitFactory")
