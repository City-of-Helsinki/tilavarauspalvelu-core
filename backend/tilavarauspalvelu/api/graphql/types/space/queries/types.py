from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import Space

from .filtersets import SpaceFilterSet
from .ordersets import SpaceOrderSet

__all__ = [
    "SpaceNode",
]


class SpaceNode(
    QueryType[Space],
    filterset=SpaceFilterSet,
    orderset=SpaceOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    max_persons = Field()
    surface_area = Field()
    code = Field()

    unit = Field()
    resources = Field()

    parent = Field()
    children = Field()
