from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from reservation_units.models import Equipment
from tilavarauspalvelu.api.graphql.types.equipment.permissions import EquipmentPermission
from tilavarauspalvelu.api.graphql.types.equipment.serializers import EquipmentSerializer

__all__ = [
    "EquipmentCreateMutation",
    "EquipmentDeleteMutation",
    "EquipmentUpdateMutation",
]


class EquipmentCreateMutation(CreateMutation):
    class Meta:
        serializer_class = EquipmentSerializer
        permission_classes = [EquipmentPermission]


class EquipmentUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = EquipmentSerializer
        permission_classes = [EquipmentPermission]


class EquipmentDeleteMutation(DeleteMutation):
    class Meta:
        model = Equipment
        permission_classes = [EquipmentPermission]
