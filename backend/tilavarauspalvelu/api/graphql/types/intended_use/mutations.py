from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from tilavarauspalvelu.models import IntendedUse
from tilavarauspalvelu.typing import AnyUser

from .permissions import IntendedUsePermission
from .serializers import IntendedUseSerializer

__all__ = [
    "IntendedUseCreateMutation",
    "IntendedUseUpdateMutation",
]


class IntendedUseCreateMutation(CreateMutation[IntendedUse, AnyUser]):
    class Meta:
        serializer_class = IntendedUseSerializer
        permission_classes = [IntendedUsePermission]


class IntendedUseUpdateMutation(UpdateMutation[IntendedUse, AnyUser]):
    class Meta:
        serializer_class = IntendedUseSerializer
        permission_classes = [IntendedUsePermission]
