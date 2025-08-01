from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import ReservationUnitType

from .filtersets import ReservationUnitTypeFilterSet
from .ordersets import ReservationUnitTypeOrderSet

__all__ = [
    "ReservationUnitTypeNode",
]


class ReservationUnitTypeNode(
    QueryType[ReservationUnitType],
    filterset=ReservationUnitTypeFilterSet,
    orderset=ReservationUnitTypeOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    rank = Field()
