from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
from tilavarauspalvelu.models import EquipmentCategory

from .filtersets import EquipmentCategoryFilterSet
from .ordersets import EquipmentCategoryOrderSet

__all__ = [
    "EquipmentCategoryNode",
]


class EquipmentCategoryNode(
    QueryType[EquipmentCategory],
    filterset=EquipmentCategoryFilterSet,
    orderset=EquipmentCategoryOrderSet,
    interfaces=[Node],
):
    pk = Field()
    rank = Field()

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")
