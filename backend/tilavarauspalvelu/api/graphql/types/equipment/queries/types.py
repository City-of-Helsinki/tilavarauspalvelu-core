from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import Equipment

from .filtersets import EquipmentFilterSet
from .orderset import EquipmentOrderSet


class EquipmentNode(
    QueryType[Equipment],
    filterset=EquipmentFilterSet,
    orderset=EquipmentOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    category = Field()
