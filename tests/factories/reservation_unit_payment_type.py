from factory import fuzzy

from reservation_units.models import ReservationUnitPaymentType
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationUnitPaymentTypeFactory",
]


class ReservationUnitPaymentTypeFactory(GenericDjangoModelFactory[ReservationUnitPaymentType]):
    class Meta:
        model = ReservationUnitPaymentType
        django_get_or_create = ["code"]

    code = fuzzy.FuzzyText()
