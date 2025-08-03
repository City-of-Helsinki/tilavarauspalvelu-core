from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.models import Resource, User

__all__ = [
    "ResourceDeleteMutation",
]


class ResourceDeleteMutation(MutationType[Resource], kind="delete"):
    pk = Input()

    @classmethod
    def __permissions__(cls, instance: Resource, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_resources(instance.space):
            msg = "No permission to delete a resource"
            raise GraphQLValidationError(msg)
