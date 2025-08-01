from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import AgeGroup

__all__ = [
    "AgeGroupNode",
]


class AgeGroupNode(QueryType[AgeGroup], interfaces=[Node]):
    pk = Field()
    minimum = Field()
    maximum = Field()
