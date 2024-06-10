from graphene_django_extensions import DjangoNode

from reservation_units.models import EquipmentCategory
from tilavarauspalvelu.api.graphql.types.equipment_category.filtersets import EquipmentCategoryFilterSet
from tilavarauspalvelu.api.graphql.types.equipment_category.permissions import EquipmentCategoryPermission

__all__ = [
    "EquipmentCategoryNode",
]


class EquipmentCategoryNode(DjangoNode):
    class Meta:
        model = EquipmentCategory
        fields = [
            "pk",
            "name",
        ]
        permission_classes = [EquipmentCategoryPermission]
        filterset_class = EquipmentCategoryFilterSet
