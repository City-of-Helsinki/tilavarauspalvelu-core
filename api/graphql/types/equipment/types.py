import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.equipment.permissions import EquipmentPermission
from api.graphql.types.equipment_category.types import EquipmentCategoryType
from reservation_units.models import Equipment


class EquipmentType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (EquipmentPermission,)
    category = graphene.Field(EquipmentCategoryType)

    class Meta:
        model = Equipment
        fields = ["pk"] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_category(self, info):
        return self.category
