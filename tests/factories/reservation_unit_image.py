import factory

from reservation_units.models import ReservationUnitImage
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationUnitImageFactory",
]


class ReservationUnitImageFactory(GenericDjangoModelFactory[ReservationUnitImage]):
    class Meta:
        model = ReservationUnitImage

    image_type = ReservationUnitImage.TYPES[0][0]
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    image = None

    large_url = ""
    medium_url = ""
    small_url = ""
