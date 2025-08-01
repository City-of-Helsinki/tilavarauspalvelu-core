from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import Resource

from .filtersets import ResourceFilterSet
from .ordersets import ResourceOrderSet

__all__ = [
    "ResourceNode",
]


class ResourceNode(
    QueryType[Resource],
    filterset=ResourceFilterSet,
    orderset=ResourceOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    location_type = Field()
    space = Field()
