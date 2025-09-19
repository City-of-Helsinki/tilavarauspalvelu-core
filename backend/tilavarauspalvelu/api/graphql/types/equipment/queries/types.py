from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    category = Field()
