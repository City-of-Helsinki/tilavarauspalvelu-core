from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitPaymentType

from ._base import FakerFI, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "ReservationUnitPaymentTypeFactory",
]


class ReservationUnitPaymentTypeFactory(GenericDjangoModelFactory[ReservationUnitPaymentType]):
    class Meta:
        model = ReservationUnitPaymentType
        django_get_or_create = ["code"]

    code = FakerFI("word", unique=True)

    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
