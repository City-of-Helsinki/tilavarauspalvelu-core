from django.core.exceptions import ValidationError
from graphene_django_extensions.bases import CreateMutation, DeleteMutation, UpdateMutation

from api.graphql.types.space.permissions import SpacePermission
from api.graphql.types.space.serializers import SpaceSerializer
from applications.models import ApplicationRound
from common.typing import AnyUser
from spaces.models import Space

__all__ = [
    "SpaceCreateMutation",
    "SpaceUpdateMutation",
    "SpaceDeleteMutation",
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
            raise ValidationError("Space occurs in active application round.")
