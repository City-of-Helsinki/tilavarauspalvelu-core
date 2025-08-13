from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import ApplicationRound, Space, User

__all__ = [
    "SpaceDeleteMutation",
]


class SpaceDeleteMutation(MutationType[Space], kind="delete"):
    pk = Input()

    @classmethod
    def __validate__(cls, instance: Space, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        active_rounds = ApplicationRound.objects.filter(reservation_units__spaces=instance).active()
        if active_rounds.exists():
            msg = "Space occurs in active application round."
            raise GraphQLValidationError(msg)

    @classmethod
    def __permissions__(cls, instance: Space, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_spaces(instance.unit):
            msg = "No permission to delete a space"
            raise GraphQLPermissionError(msg)
