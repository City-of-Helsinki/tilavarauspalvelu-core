from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.models import Resource
from tilavarauspalvelu.typing import AnyUser

from .permissions import ResourcePermission
from .serializers import ResourceSerializer


class ResourceCreateMutation(CreateMutation[Resource, AnyUser]):
    class Meta:
        serializer_class = ResourceSerializer
        permission_classes = [ResourcePermission]


class ResourceUpdateMutation(UpdateMutation[Resource, AnyUser]):
    class Meta:
        serializer_class = ResourceSerializer
        permission_classes = [ResourcePermission]


class ResourceDeleteMutation(DeleteMutation[Resource, AnyUser]):
    class Meta:
        model = Resource
        permission_classes = [ResourcePermission]

    @classmethod
    def validate_deletion(cls, instance: Resource, user: AnyUser) -> None:
        if instance.reservation_units.exists():
            msg = "Cannot delete resource which has associated reservation units"
            raise ValidationError(msg)
