import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.duration_field import Duration
from api.graphql.spaces.space_types import BuildingType
from api.graphql.translate_fields import get_all_translatable_fields
from permissions.api_permissions.graphene_permissions import ResourcePermission
from resources.models import Resource


class ResourceType(AuthNode, PrimaryKeyObjectType):
    building = graphene.List(BuildingType)
    buffer_time_before = Duration()
    buffer_time_after = Duration()

    permission_classes = (ResourcePermission,)

    class Meta:
        model = Resource
        fields = [
            "pk",
            "location_type",
            "space",
            "buffer_time_before",
            "buffer_time_after",
        ] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection
