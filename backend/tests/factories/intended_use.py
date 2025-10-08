from __future__ import annotations

import factory
from factory import LazyAttribute

from tilavarauspalvelu.models import IntendedUse

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "IntendedUseFactory",
]


class IntendedUseFactory(GenericDjangoModelFactory[IntendedUse]):
    class Meta:
        model = IntendedUse

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    rank = factory.Sequence(lambda n: n + 1)

    image = None  # `easy_thumbnails.files.ThumbnailFile`

    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
