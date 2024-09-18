from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from resources.models import Resource

from .permissions import ResourcePermission
from .serializers import ResourceSerializer


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
