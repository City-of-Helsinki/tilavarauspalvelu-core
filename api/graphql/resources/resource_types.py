import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.spaces.space_types import BuildingType
from permissions.api_permissions.graphene_permissions import ResourcePermission
from resources.models import Resource


class ResourceType(AuthNode, PrimaryKeyObjectType):
    name_fi = graphene.String()
    name_sv = graphene.String()
    name_en = graphene.String()
    description_fi = graphene.String()
    description_sv = graphene.String()
    description_en = graphene.String()
    building = graphene.List(BuildingType)

    permission_classes = (
        (ResourcePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = Resource
        fields = (
            "id",
            "location_type",
            "name_fi",
            "name_sv",
            "name_en",
            "description_fi",
            "description_sv",
            "description_en",
            "space",
            "buffer_time_before",
            "buffer_time_after",
            "is_draft",
        )

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)

    def resolve_buffer_time_before(self, info):
        if self.buffer_time_before is None:
            return None
        return self.buffer_time_before.total_seconds()

    def resolve_buffer_time_after(self, info):
        if self.buffer_time_after is None:
            return None
        return self.buffer_time_after.total_seconds()
