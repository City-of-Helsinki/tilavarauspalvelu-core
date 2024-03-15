import graphene
from graphene_django_extensions.fields import RelatedField
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.duration_field import Duration
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.building.types import BuildingType
from api.graphql.types.resources.permissions import ResourcePermission
from api.graphql.types.spaces.types import SpaceType
from resources.choices import ResourceLocationType
from resources.models import Resource


class ResourceType(AuthNode, OldPrimaryKeyObjectType):
    building = graphene.List(BuildingType)
    location_type = graphene.Field(graphene.Enum.from_enum(ResourceLocationType))
    space = RelatedField(SpaceType)
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
            *get_all_translatable_fields(model),
        ]

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
