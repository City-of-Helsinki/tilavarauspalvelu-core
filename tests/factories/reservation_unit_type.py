from __future__ import annotations

import factory
from factory import LazyAttribute

from tilavarauspalvelu.models import ReservationUnitType

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ReservationUnitTypeFactory",
]


class ReservationUnitTypeFactory(GenericDjangoModelFactory[ReservationUnitType]):
    class Meta:
        model = ReservationUnitType

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    rank = factory.Sequence(lambda n: n)

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
