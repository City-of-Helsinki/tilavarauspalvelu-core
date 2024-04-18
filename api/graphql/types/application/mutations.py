from graphene_django_extensions import CreateMutation, UpdateMutation

from api.graphql.types.application.permissions import ApplicationPermission
from api.graphql.types.application.serializers import (
    ApplicationCancelSerializer,
    ApplicationCreateSerializer,
    ApplicationSendSerializer,
    ApplicationUpdateSerializer,
)

__all__ = [
    "ApplicationCancelMutation",
    "ApplicationCreateMutation",
    "ApplicationSendMutation",
    "ApplicationUpdateMutation",
]


class ApplicationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ApplicationCreateSerializer
        permission_classes = [ApplicationPermission]


class ApplicationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationUpdateSerializer
        permission_classes = [ApplicationPermission]


class ApplicationSendMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationSendSerializer
        permission_classes = [ApplicationPermission]


class ApplicationCancelMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationCancelSerializer
        permission_classes = [ApplicationPermission]
