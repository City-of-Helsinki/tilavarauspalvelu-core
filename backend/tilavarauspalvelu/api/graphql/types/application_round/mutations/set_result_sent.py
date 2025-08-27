import datetime
from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import ApplicationRound, User
from tilavarauspalvelu.tasks import send_application_handled_email_task
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime

__all__ = [
    "SetApplicationRoundResultsSentMutation",
]


class SetApplicationRoundResultsSentMutation(MutationType[ApplicationRound], kind="update"):
    pk = Input(required=True)

    @Input(hidden=True)
    def sent_at(self, info: GQLInfo[User]) -> datetime.datetime:
        return local_datetime()

    @classmethod
    def __permissions__(cls, instance: ApplicationRound, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application_round(instance):
            msg = "No permission to manage this application round."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationRound, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        if instance.status != ApplicationRoundStatusChoice.HANDLED:
            msg = "Application round is not in handled status."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_HANDLED)

    @classmethod
    def __after__(cls, instance: ApplicationRound, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        send_application_handled_email_task.delay()
