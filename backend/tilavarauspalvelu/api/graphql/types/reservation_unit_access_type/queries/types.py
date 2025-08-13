from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import ReservationUnitAccessType

from .filtersets import ReservationUnitAccessTypeFilterSet
from .orderset import ReservationUnitAccessTypeOrderSet

__all__ = [
    "ReservationUnitAccessTypeNode",
]


class ReservationUnitAccessTypeNode(
    QueryType[ReservationUnitAccessType],
    filterset=ReservationUnitAccessTypeFilterSet,
    orderset=ReservationUnitAccessTypeOrderSet,
    interfaces=[Node],
):
    pk = Field()
    access_type = Field()
    begin_date = Field()
