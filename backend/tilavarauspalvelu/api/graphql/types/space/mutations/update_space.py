from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Space, User

__all__ = [
    "SpaceUpdateMutation",
]


class SpaceUpdateMutation(MutationType[Space], kind="update"):
    pk = Input()
    name = Input()
    surface_area = Input()
    max_persons = Input()
    code = Input()
    parent = Input()

    @classmethod
    def __permissions__(cls, instance: Space, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        unit = instance.unit
        user = info.context.user
        if not user.permissions.can_manage_spaces(unit):
            msg = "No permission to create a space"
            raise GraphQLPermissionError(msg)
