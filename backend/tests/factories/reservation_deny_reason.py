from __future__ import annotations

from factory import LazyAttribute, Sequence

from tilavarauspalvelu.models import ReservationDenyReason

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ReservationDenyReasonFactory",
]


class ReservationDenyReasonFactory(GenericDjangoModelFactory[ReservationDenyReason]):
    class Meta:
        model = ReservationDenyReason

    rank = Sequence(lambda n: n + 1)

    reason = FakerFI("word")
    reason_fi = LazyAttribute(lambda i: i.reason)
    reason_en = FakerEN("word")
    reason_sv = FakerSV("word")

    reservations = ReverseForeignKeyFactory("tests.factories.reservation.ReservationFactory")
