from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import ReservationPurpose

from .filtersets import ReservationPurposeFilterSet
from .ordersets import ReservationPurposeOrderSet

__all__ = [
    "ReservationPurposeNode",
]


class ReservationPurposeNode(
    QueryType[ReservationPurpose],
    filterset=ReservationPurposeFilterSet,
    orderset=ReservationPurposeOrderSet,
    interfaces=[Node],
):
    pk = Field()
    rank = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()
