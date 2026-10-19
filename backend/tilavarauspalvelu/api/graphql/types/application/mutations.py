from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from tilavarauspalvelu.models import Application
from tilavarauspalvelu.typing import AnyUser

from .permissions import ApplicationPermission, ApplicationWorkingMemoPermission, UpdateAllApplicationOptionsPermission
from .serializers import (
    ApplicationCancelSerializer,
    ApplicationCreateSerializer,
    ApplicationSendSerializer,
    ApplicationUpdateSerializer,
    ApplicationWorkingMemoSerializer,
    RejectAllApplicationOptionsSerializer,
    RestoreAllApplicationOptionsSerializer,
)

__all__ = [
    "ApplicationCancelMutation",
    "ApplicationCreateMutation",
    "ApplicationSendMutation",
    "ApplicationUpdateMutation",
    "ApplicationWorkingMemoMutation",
    "RejectAllApplicationOptionsMutation",
    "RestoreAllApplicationOptionsMutation",
]


class ApplicationCreateMutation(CreateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = ApplicationCreateSerializer
        permission_classes = [ApplicationPermission]


class ApplicationUpdateMutation(UpdateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = ApplicationUpdateSerializer
        permission_classes = [ApplicationPermission]


class ApplicationSendMutation(UpdateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = ApplicationSendSerializer
        permission_classes = [ApplicationPermission]


class ApplicationCancelMutation(UpdateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = ApplicationCancelSerializer
        permission_classes = [ApplicationPermission]


class ApplicationWorkingMemoMutation(UpdateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = ApplicationWorkingMemoSerializer
        permission_classes = [ApplicationWorkingMemoPermission]


class RejectAllApplicationOptionsMutation(UpdateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = RejectAllApplicationOptionsSerializer
        permission_classes = [UpdateAllApplicationOptionsPermission]


class RestoreAllApplicationOptionsMutation(UpdateMutation[Application, AnyUser]):
    class Meta:
        serializer_class = RestoreAllApplicationOptionsSerializer
        permission_classes = [UpdateAllApplicationOptionsPermission]
