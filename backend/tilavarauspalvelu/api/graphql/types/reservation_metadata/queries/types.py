from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import ReservationMetadataField, ReservationMetadataSet

__all__ = [
    "ReservationMetadataFieldNode",
    "ReservationMetadataSetNode",
]


class ReservationMetadataFieldNode(QueryType[ReservationMetadataField], interfaces=[Node]):
    pk = Field()
    field_name = Field()


class ReservationMetadataSetNode(QueryType[ReservationMetadataSet], interfaces=[Node]):
    pk = Field()
    name = Field()
    supported_fields = Field()
    required_fields = Field()
