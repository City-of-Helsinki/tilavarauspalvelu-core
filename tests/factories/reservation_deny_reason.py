from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.models import ReservationDenyReason

__all__ = [
    "ReservationDenyReasonFactory",
]


class ReservationDenyReasonFactory(GenericDjangoModelFactory[ReservationDenyReason]):
    class Meta:
        model = ReservationDenyReason
