from graphene_permissions.mixins import AuthFilter

from api.graphql.types.equipment_category.permissions import EquipmentCategoryPermission


class EquipmentCategoryFilter(AuthFilter):
    permission_classes = (EquipmentCategoryPermission,)
