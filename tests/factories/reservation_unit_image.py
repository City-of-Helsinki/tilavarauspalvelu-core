import factory

from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.enums import ReservationUnitImageType
from tilavarauspalvelu.models import ReservationUnitImage

__all__ = [
    "ReservationUnitImageFactory",
]


class ReservationUnitImageFactory(GenericDjangoModelFactory[ReservationUnitImage]):
    class Meta:
        model = ReservationUnitImage

    image_type = ReservationUnitImageType.MAIN.value
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    image = None

    large_url = ""
    medium_url = ""
    small_url = ""
