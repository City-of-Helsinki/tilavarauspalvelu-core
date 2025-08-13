from undine import Field, QueryType
from undine.relay import Node

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

    name_fi = Field()
    name_sv = Field()
    name_en = Field()
