from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Application

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ApplicationWorkingMemoMutation",
]


class ApplicationWorkingMemoMutation(MutationType[Application], auto=False, kind="update"):
    pk = Input()
    work_memo = Input()

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance, reserver_needs_role=True):
            msg = "No permission to change working memo for this application."
            raise GraphQLPermissionError(msg)
