from __future__ import annotations

from typing import TYPE_CHECKING, Any

from lookup_property import L
from undine import Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import ApplicationRound
from tilavarauspalvelu.tasks import generate_reservation_series_from_allocations_task
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    import datetime

    from undine import GQLInfo
    from undine.typing import TModel


__all__ = [
    "SetApplicationRoundHandledMutation",
]


class SetApplicationRoundHandledMutation(MutationType[ApplicationRound], auto=False, kind="update"):
    pk = Input()

    @Input
    def handled_at(self, info: GQLInfo) -> datetime.datetime:
        return local_datetime()

    @classmethod
    def __permissions__(cls, instance: ApplicationRound, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application_round(instance):
            msg = "No permission to manage this application round."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationRound, info: GQLInfo, input_data: dict[str, Any]) -> None:
        if instance.status != ApplicationRoundStatusChoice.IN_ALLOCATION:
            msg = "Application round is not in allocation status."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_ALLOCATION)

        if instance.applications.filter(L(status=ApplicationStatusChoice.IN_ALLOCATION)).exists():
            msg = "Application round has applications still in allocation."
            raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS)

    @classmethod
    def __after__(cls, instance: TModel, info: GQLInfo, previous_data: dict[str, Any]) -> None:
        generate_reservation_series_from_allocations_task.delay(instance.pk)
