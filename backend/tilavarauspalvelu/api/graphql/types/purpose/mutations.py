from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from .permissions import PurposePermission
from .serializers import PurposeSerializer

__all__ = [
    "PurposeCreateMutation",
    "PurposeUpdateMutation",
]


class PurposeCreateMutation(CreateMutation):
    class Meta:
        serializer_class = PurposeSerializer
        permission_classes = [PurposePermission]


class PurposeUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = PurposeSerializer
        permission_classes = [PurposePermission]
