import graphene
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.resources.permissions import ResourcePermission
from api.graphql.types.resources.serializers import ResourceCreateSerializer, ResourceUpdateSerializer
from api.graphql.types.resources.types import ResourceType
from resources.models import Resource


class ResourceCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    resource = graphene.Field(ResourceType)

    permission_classes = (ResourcePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ResourceCreateSerializer


class ResourceUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    resource = graphene.Field(ResourceType)

    permission_classes = (ResourcePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ResourceUpdateSerializer


class ResourceDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (ResourcePermission,)
    model = Resource

    @classmethod
    def validate(cls, root, info, **input):
        return None
