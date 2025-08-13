from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource, User

__all__ = [
    "ResourceUpdateMutation",
]


class ResourceUpdateMutation(MutationType[Resource], kind="update"):
    pk = Input()
    name_fi = Input()
    name_sv = Input()
    name_en = Input()
    location_type = Input()
    space = Input()

    @classmethod
    def __validate__(cls, instance: Resource, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        location_type = input_data.get("location_type", instance.location_type)
        space = input_data.get("space", instance.space)

        if location_type == ResourceLocationType.FIXED and space is None:
            msg = "Location type 'fixed' needs a space to be defined."
            raise GraphQLValidationError(msg)

    @classmethod
    def __permissions__(cls, instance: Resource, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        space = instance.space
        if not user.permissions.can_manage_resources(space):
            msg = "No permission to update a resource"
            raise GraphQLValidationError(msg)
