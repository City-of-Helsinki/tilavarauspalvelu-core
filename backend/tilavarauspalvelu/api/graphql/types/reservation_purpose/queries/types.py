from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")
