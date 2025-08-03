from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Space, Unit, User

__all__ = [
    "SpaceCreateMutation",
]


class SpaceCreateMutation(MutationType[Space], kind="create"):
    name = Input()
    surface_area = Input()
    max_persons = Input()
    code = Input()

    unit = Input(required=True)
    parent = Input()

    @classmethod
    def __permissions__(cls, instance: Space, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        unit_pk: int = input_data["unit"]

        unit = Unit.objects.filter(pk=unit_pk).first()
        if unit is None:
            msg = f"Unit with primary key {unit_pk!r} does not exist."
            raise GraphQLPermissionError(msg)

        user = info.context.user
        if not user.permissions.can_manage_spaces(unit):
            msg = "No permission to create a space"
            raise GraphQLPermissionError(msg)
