from graphene_django_extensions import DjangoNode

from api.graphql.types.equipment.filtersets import EquipmentFilterSet
from api.graphql.types.equipment.permissions import EquipmentPermission
from reservation_units.models import Equipment


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
