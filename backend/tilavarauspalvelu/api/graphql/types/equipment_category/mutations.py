from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models import EquipmentCategory
from tilavarauspalvelu.typing import AnyUser

from .permissions import EquipmentCategoryPermission
from .serializers import EquipmentCategorySerializer

__all__ = [
    "EquipmentCategoryCreateMutation",
    "EquipmentCategoryDeleteMutation",
    "EquipmentCategoryUpdateMutation",
]


class EquipmentCategoryCreateMutation(CreateMutation[EquipmentCategory, AnyUser]):
    class Meta:
        serializer_class = EquipmentCategorySerializer
        permission_classes = [EquipmentCategoryPermission]


class EquipmentCategoryUpdateMutation(UpdateMutation[EquipmentCategory, AnyUser]):
    class Meta:
        serializer_class = EquipmentCategorySerializer
        permission_classes = [EquipmentCategoryPermission]


class EquipmentCategoryDeleteMutation(DeleteMutation[EquipmentCategory, AnyUser]):
    class Meta:
        model = EquipmentCategory
        permission_classes = [EquipmentCategoryPermission]
