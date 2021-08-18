import graphene
from django.conf import settings
from graphene_django import DjangoObjectType
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.spaces.space_types import BuildingType
from api.graphql.translate_fields import (
    django_type_self_resolver,
    get_translatable_field,
)
from permissions.api_permissions.graphene_permissions import ResourcePermission
from resources.models import Resource


class ResourceDescriptionField(DjangoObjectType):
    class Meta:
        model = Resource
        fields = get_translatable_field(model, "description")


class ResourceNameField(DjangoObjectType):
    class Meta:
        model = Resource
        fields = get_translatable_field(model, "name")


class ResourceType(AuthNode, PrimaryKeyObjectType):
    name = graphene.Field(ResourceNameField, resolver=django_type_self_resolver)
    description = graphene.Field(
        ResourceDescriptionField, resolver=django_type_self_resolver
    )
    building = graphene.List(BuildingType)

    permission_classes = (
        (ResourcePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = Resource
        fields = (
            "id",
            "location_type",
            "name",
            "description",
            "space",
            "buffer_time_before",
            "buffer_time_after",
            "is_draft",
        )

        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
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
