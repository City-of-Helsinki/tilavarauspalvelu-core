from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import AllocatedTimeSlot, Application, ReservationUnitOption
from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "RejectAllApplicationOptionsMutation",
]


class RejectAllApplicationOptionsMutation(MutationType[Application], auto=False):
    pk = Input()

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance, reserver_needs_role=True, all_units=True):
            msg = "No permission to reject all application options."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Application, info: GQLInfo, input_data: dict[str, Any]) -> None:
        slots_exist = AllocatedTimeSlot.objects.filter(reservation_unit_option__application_section=instance).exists()
        if slots_exist:
            msg = "Application has allocated time slots and cannot be rejected."
            raise GraphQLValidationError(msg, code=error_codes.CANNOT_REJECT_APPLICATION_OPTIONS)

    @classmethod
    def __mutate__(cls, instance: Application, info: GQLInfo, input_data: dict[str, Any]) -> Application:
        ReservationUnitOption.objects.filter(application_section__application=instance).update(is_rejected=True)
        return instance
