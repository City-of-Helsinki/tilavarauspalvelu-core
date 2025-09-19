from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from .permissions import IntendedUsePermission
from .serializers import IntendedUseSerializer

__all__ = [
    "IntendedUseCreateMutation",
    "IntendedUseUpdateMutation",
]


class IntendedUseCreateMutation(CreateMutation):
    class Meta:
        serializer_class = IntendedUseSerializer
        permission_classes = [IntendedUsePermission]


class IntendedUseUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = IntendedUseSerializer
        permission_classes = [IntendedUsePermission]
