from __future__ import annotations

from tilavarauspalvelu.models import Equipment

from .permissions import EquipmentPermission
from .serializers import EquipmentSerializer

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
