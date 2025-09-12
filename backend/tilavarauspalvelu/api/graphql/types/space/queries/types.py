from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    max_persons = Field()
    surface_area = Field()
    code = Field()

    unit = Field()
    resources = Field()

    parent = Field()
    children = Field()
