from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import AllocatedTimeSlot

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "AllocatedTimeSlotDeleteMutation",
]


class AllocatedTimeSlotDeleteMutation(MutationType[AllocatedTimeSlot]):
    @classmethod
    def __permissions__(cls, instance: AllocatedTimeSlot, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        unit = instance.reservation_unit_option.reservation_unit.unit
        if user.permissions.can_manage_applications_for_units([unit]):
            return

        msg = "Cannot delete allocations from an application round not in the allocation stage."
        raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: AllocatedTimeSlot, info: GQLInfo, input_data: dict[str, Any]) -> None:
        application_round = instance.reservation_unit_option.application_section.application.application_round
        if not application_round.status.can_remove_allocations:
            msg = "Cannot delete allocations from an application round not in the allocation stage."
            raise GraphQLValidationError(msg)
