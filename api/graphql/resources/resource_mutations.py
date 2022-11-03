import graphene
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.base_mutations import AuthDeleteMutation, AuthSerializerMutation
from api.graphql.resources.resource_serializers import (
    ResourceCreateSerializer,
    ResourceUpdateSerializer,
)
from api.graphql.resources.resource_types import ResourceType
from permissions.api_permissions.graphene_permissions import ResourcePermission
from resources.models import Resource


class ResourceCreateMutation(AuthSerializerMutation, SerializerMutation):
    resource = graphene.Field(ResourceType)

    permission_classes = (ResourcePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ResourceCreateSerializer


class ResourceUpdateMutation(AuthSerializerMutation, SerializerMutation):
    resource = graphene.Field(ResourceType)

    permission_classes = (ResourcePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ResourceUpdateSerializer


class ResourceDeleteMutation(AuthDeleteMutation, ClientIDMutation):
    permission_classes = (ResourcePermission,)
    model = Resource

    @classmethod
    def validate(self, root, info, **input):
        return None
