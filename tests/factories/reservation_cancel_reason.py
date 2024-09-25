from factory import fuzzy

from tilavarauspalvelu.models import ReservationCancelReason

from ._base import GenericDjangoModelFactory, OneToManyFactory

__all__ = [
    "ReservationCancelReasonFactory",
]


class ReservationCancelReasonFactory(GenericDjangoModelFactory[ReservationCancelReason]):
    class Meta:
        model = ReservationCancelReason

    reason = fuzzy.FuzzyText()

    reservations = OneToManyFactory("tests.factories.reservation.ReservationFactory")
