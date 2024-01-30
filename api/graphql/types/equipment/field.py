from graphene_permissions.mixins import AuthFilter

from api.graphql.types.equipment.permissions import EquipmentPermission


class EquipmentFilter(AuthFilter):
    permission_classes = (EquipmentPermission,)
