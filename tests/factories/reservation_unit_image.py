from tilavarauspalvelu.enums import ReservationUnitImageType
from tilavarauspalvelu.models import ReservationUnitImage

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "ReservationUnitImageFactory",
]


class ReservationUnitImageFactory(GenericDjangoModelFactory[ReservationUnitImage]):
    class Meta:
        model = ReservationUnitImage

    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory")

    image = None  # `easy_thumbnails.files.ThumbnailFile`
    image_type = ReservationUnitImageType.MAIN
    large_url = ""
    medium_url = ""
    small_url = ""
