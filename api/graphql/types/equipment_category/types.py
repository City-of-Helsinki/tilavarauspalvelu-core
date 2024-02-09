import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.equipment_category.permissions import EquipmentCategoryPermission
from reservation_units.models import EquipmentCategory


class EquipmentCategoryType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (EquipmentCategoryPermission,)

    class Meta:
        model = EquipmentCategory
        fields = ["pk", *get_all_translatable_fields(model)]

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
