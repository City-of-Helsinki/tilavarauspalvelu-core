from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import Qualifier

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "QualifierFactory",
]


class QualifierFactory(GenericDjangoModelFactory[Qualifier]):
    class Meta:
        model = Qualifier

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
