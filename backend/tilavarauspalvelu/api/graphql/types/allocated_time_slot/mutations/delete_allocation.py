from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import AllocatedTimeSlot, User

__all__ = [
    "AllocatedTimeSlotDeleteMutation",
]


class AllocatedTimeSlotDeleteMutation(MutationType[AllocatedTimeSlot], kind="delete"):
    pk = Input(required=True)

    @classmethod
    def __permissions__(cls, instance: AllocatedTimeSlot, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        unit = instance.reservation_unit_option.reservation_unit.unit
        if not user.permissions.can_manage_applications_for_units([unit]):
            msg = "No permission to delete allocation."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: AllocatedTimeSlot, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        application_round = instance.reservation_unit_option.application_section.application.application_round
        if not application_round.status.can_remove_allocations:
            msg = "Cannot delete allocations from an application round not in the allocation stage."
            raise GraphQLValidationError(msg)
