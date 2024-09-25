from factory import fuzzy

from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.models import ReservationUnitPaymentType

__all__ = [
    "ReservationUnitPaymentTypeFactory",
]


class ReservationUnitPaymentTypeFactory(GenericDjangoModelFactory[ReservationUnitPaymentType]):
    class Meta:
        model = ReservationUnitPaymentType
        django_get_or_create = ["code"]

    code = fuzzy.FuzzyText()
