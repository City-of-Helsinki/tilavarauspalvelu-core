from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from reservation_units.models import EquipmentCategory

from .permissions import EquipmentCategoryPermission
from .serializers import EquipmentCategorySerializer

__all__ = [
    "EquipmentCategoryCreateMutation",
    "EquipmentCategoryUpdateMutation",
    "EquipmentCategoryDeleteMutation",
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
