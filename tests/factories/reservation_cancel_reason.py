from reservations.models import ReservationCancelReason
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationCancelReasonFactory",
]


class ReservationCancelReasonFactory(GenericDjangoModelFactory[ReservationCancelReason]):
    class Meta:
        model = ReservationCancelReason
