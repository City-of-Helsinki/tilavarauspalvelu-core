from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource, Space, User

__all__ = [
    "ResourceCreateMutation",
]


class ResourceCreateMutation(MutationType[Resource], kind="create"):
    name_fi = Input(required=True)
    name_sv = Input()
    name_en = Input()
    location_type = Input()
    space = Input()

    @classmethod
    def __validate__(cls, instance: Resource, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        location_type = input_data.get("location_type", ResourceLocationType.FIXED)
        space = input_data.get("space")

        if location_type == ResourceLocationType.FIXED and space is None:
            msg = "Location type 'fixed' needs a space to be defined."
            raise GraphQLValidationError(msg)

    @classmethod
    def __permissions__(cls, instance: Resource, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        space: Space | None = input_data.get("space")

        user = info.context.user
        if not user.permissions.can_manage_resources(space):
            msg = "No permission to create a resource"
            raise GraphQLValidationError(msg)
