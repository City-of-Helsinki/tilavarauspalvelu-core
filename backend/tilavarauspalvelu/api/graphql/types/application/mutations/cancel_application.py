import datetime
from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import Application, User
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime


class ApplicationCancelMutation(MutationType[Application], kind="update"):
    pk = Input(required=True)

    @Input(hidden=True)
    def cancelled_at(self, info: GQLInfo[User]) -> datetime.datetime:
        return local_datetime()

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance):
            msg = "No permission to manage this application."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        status = instance.status
        if not status.can_cancel:
            msg = f"Application in status '{status.value}' cannot be cancelled."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_STATUS_CANNOT_CANCEL)
