import factory
from factory import LazyAttribute

from tilavarauspalvelu.models import Purpose

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "PurposeFactory",
]


class PurposeFactory(GenericDjangoModelFactory[Purpose]):
    class Meta:
        model = Purpose

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    rank = factory.Sequence(lambda n: n + 1)

    image = None  # `easy_thumbnails.files.ThumbnailFile`

    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
