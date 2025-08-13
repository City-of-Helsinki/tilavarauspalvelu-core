from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Application, User

__all__ = [
    "ApplicationWorkingMemoMutation",
]


class ApplicationWorkingMemoMutation(MutationType[Application], kind="update"):
    pk = Input(required=True)
    working_memo = Input(required=True)

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance, reserver_needs_role=True):
            msg = "No permission to change working memo for this application."
            raise GraphQLPermissionError(msg)
