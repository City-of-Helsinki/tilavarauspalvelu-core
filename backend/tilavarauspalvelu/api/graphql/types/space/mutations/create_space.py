from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import Space, Unit, User

__all__ = [
    "SpaceCreateMutation",
]


class SpaceCreateMutation(MutationType[Space], kind="create"):
    name_fi = Input(required=True)
    name_sv = Input()
    name_en = Input()
    surface_area = Input()
    max_persons = Input()
    code = Input()

    unit = Input(Unit, required=True)
    parent = Input(Space)

    # Set tree fields to zero and rebuild tree in `__after__`
    tree_id = Input(int, hidden=True, default_value=0)
    level = Input(int, hidden=True, default_value=0)
    lft = Input(int, hidden=True, default_value=0)
    rght = Input(int, hidden=True, default_value=0)

    @name_fi.validate
    def validate_name_fi(root: Space, info: GQLInfo[User], value: str) -> None:
        if not value.strip():
            msg = "This field cannot be blank."
            raise GraphQLValidationError(msg)

    @classmethod
    def __permissions__(cls, instance: Space, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        unit: Unit = input_data["unit"]
        user = info.context.user
        if not user.permissions.can_manage_spaces(unit):
            msg = "No permission to create a space"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __after__(cls, instance: Space, info: GQLInfo, input_data: dict[str, Any]) -> None:
        Space.objects.rebuild()
