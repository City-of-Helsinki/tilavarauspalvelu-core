from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.models import Resource

from .permissions import ResourcePermission
from .serializers import ResourceSerializer

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User


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

    @classmethod
    def validate_deletion(cls, instance: Resource, user: User) -> None:
        if instance.reservation_units.exists():
            msg = "Cannot delete resource which has associated reservation units"
            raise ValidationError(msg)
