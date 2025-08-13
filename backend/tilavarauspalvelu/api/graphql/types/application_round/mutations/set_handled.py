import datetime
from typing import Any

from lookup_property import L
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import ApplicationRound, User
from tilavarauspalvelu.tasks import generate_reservation_series_from_allocations_task
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime

__all__ = [
    "SetApplicationRoundHandledMutation",
]


class SetApplicationRoundHandledMutation(MutationType[ApplicationRound], kind="update"):
    pk = Input(required=True)

    @Input(hidden=True)
    def handled_at(self, info: GQLInfo[User]) -> datetime.datetime:
        return local_datetime()

    @classmethod
    def __permissions__(cls, instance: ApplicationRound, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application_round(instance):
            msg = "No permission to manage this application round."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationRound, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        if instance.status != ApplicationRoundStatusChoice.IN_ALLOCATION:
            msg = "Application round is not in allocation status."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_ALLOCATION)

        if instance.applications.filter(L(status=ApplicationStatusChoice.IN_ALLOCATION)).exists():
            msg = "Application round has applications still in allocation."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS)

    @classmethod
    def __after__(cls, instance: ApplicationRound, info: GQLInfo[User], previous_data: dict[str, Any]) -> None:
        generate_reservation_series_from_allocations_task.delay(instance.pk)
