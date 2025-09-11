from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    location_type = Field()
    space = Field()
