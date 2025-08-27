from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import Space, User

__all__ = [
    "SpaceUpdateMutation",
]


class SpaceUpdateMutation(MutationType[Space], kind="update"):
    pk = Input()
    name_fi = Input()
    name_sv = Input()
    name_en = Input()
    surface_area = Input()
    max_persons = Input()
    code = Input()
    parent = Input()

    @name_fi.validate
    def validate_name_fi(root: Space, info: GQLInfo[User], value: str) -> None:
        if not value.strip():
            msg = "This field cannot be blank."
            raise GraphQLValidationError(msg)

    @classmethod
    def __permissions__(cls, instance: Space, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        unit = instance.unit
        user = info.context.user
        if not user.permissions.can_manage_spaces(unit):
            msg = "No permission to update a space"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __after__(cls, instance: Space, info: GQLInfo, input_data: dict[str, Any]) -> None:
        Space.objects.rebuild()
