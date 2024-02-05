from reservations.models import ReservationDenyReason
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationDenyReasonFactory",
]


class ReservationDenyReasonFactory(GenericDjangoModelFactory[ReservationDenyReason]):
    class Meta:
        model = ReservationDenyReason
