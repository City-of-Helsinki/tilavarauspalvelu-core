from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from api.graphql.types.resource.permissions import ResourcePermission
from api.graphql.types.resource.serializers import ResourceSerializer
from resources.models import Resource


class ResourceCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ResourceSerializer
        permission_classes = [ResourcePermission]


class ResourceUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ResourceSerializer
        permission_classes = [ResourcePermission]


class ResourceDeleteMutation(DeleteMutation):
    class Meta:
        model = Resource
        permission_classes = [ResourcePermission]
