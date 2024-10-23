from factory import LazyAttribute

from tilavarauspalvelu.models import ReservationCancelReason

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ReservationCancelReasonFactory",
]


class ReservationCancelReasonFactory(GenericDjangoModelFactory[ReservationCancelReason]):
    class Meta:
        model = ReservationCancelReason

    reason = FakerFI("word")
    reason_fi = LazyAttribute(lambda i: i.reason)
    reason_en = FakerEN("word")
    reason_sv = FakerSV("word")

    reservations = ReverseForeignKeyFactory("tests.factories.reservation.ReservationFactory")
