from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models import EquipmentCategory

from .permissions import EquipmentCategoryPermission
from .serializers import EquipmentCategorySerializer

__all__ = [
    "EquipmentCategoryCreateMutation",
    "EquipmentCategoryDeleteMutation",
    "EquipmentCategoryUpdateMutation",
]


class EquipmentCategoryCreateMutation(CreateMutation):
    class Meta:
        serializer_class = EquipmentCategorySerializer
        permission_classes = [EquipmentCategoryPermission]


class EquipmentCategoryUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = EquipmentCategorySerializer
        permission_classes = [EquipmentCategoryPermission]


class EquipmentCategoryDeleteMutation(DeleteMutation):
    class Meta:
        model = EquipmentCategory
        permission_classes = [EquipmentCategoryPermission]
