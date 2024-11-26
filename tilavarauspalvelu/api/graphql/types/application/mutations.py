from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from .permissions import ApplicationPermission, UpdateAllApplicationOptionsPermission
from .serializers import (
    ApplicationCancelSerializer,
    ApplicationCreateSerializer,
    ApplicationSendSerializer,
    ApplicationUpdateSerializer,
    RejectAllApplicationOptionsSerializer,
    RestoreAllApplicationOptionsSerializer,
)

__all__ = [
    "ApplicationCancelMutation",
    "ApplicationCreateMutation",
    "ApplicationSendMutation",
    "ApplicationUpdateMutation",
    "RejectAllApplicationOptionsMutation",
    "RestoreAllApplicationOptionsMutation",
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


class RejectAllApplicationOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RejectAllApplicationOptionsSerializer
        permission_classes = [UpdateAllApplicationOptionsPermission]


class RestoreAllApplicationOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RestoreAllApplicationOptionsSerializer
        permission_classes = [UpdateAllApplicationOptionsPermission]
