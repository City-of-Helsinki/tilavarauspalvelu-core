from graphene_django_extensions import DjangoNode

from reservation_units.models import Equipment
from tilavarauspalvelu.api.graphql.types.equipment.filtersets import EquipmentFilterSet
from tilavarauspalvelu.api.graphql.types.equipment.permissions import EquipmentPermission


class EquipmentNode(DjangoNode):
    class Meta:
        model = Equipment
        fields = [
            "pk",
            "name",
            "category",
        ]
        filterset_class = EquipmentFilterSet
        permission_classes = [EquipmentPermission]
