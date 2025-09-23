from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    rank = Field()
