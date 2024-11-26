from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from graphene_django_extensions.bases import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models import ApplicationRound, Space

from .permissions import SpacePermission
from .serializers import SpaceSerializer

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "SpaceCreateMutation",
    "SpaceDeleteMutation",
    "SpaceUpdateMutation",
]


class SpaceCreateMutation(CreateMutation):
    class Meta:
        serializer_class = SpaceSerializer
        permission_classes = [SpacePermission]


class SpaceUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = SpaceSerializer
        permission_classes = [SpacePermission]


class SpaceDeleteMutation(DeleteMutation):
    class Meta:
        model = Space
        permission_classes = [SpacePermission]

    @classmethod
    def validate_deletion(cls, instance: Space, user: AnyUser) -> None:
        in_active_round = ApplicationRound.objects.active().filter(reservation_units__spaces=instance).exists()
        if in_active_round:
            msg = "Space occurs in active application round."
            raise ValidationError(msg)
