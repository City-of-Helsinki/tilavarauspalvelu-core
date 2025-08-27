from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import AllocatedTimeSlot, Application, ReservationUnitOption, User
from tilavarauspalvelu.typing import error_codes

__all__ = [
    "RejectAllApplicationOptionsMutation",
]


class RejectAllApplicationOptionsMutation(MutationType[Application], kind="update"):
    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Application, info: GQLInfo[User], input_data: dict[str, Any]) -> Application:
        user = info.context.user
        if not user.permissions.can_manage_application(instance, reserver_needs_role=True, all_units=True):
            msg = "No permission to reject all application options."
            raise GraphQLPermissionError(msg)

        slots_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application=instance,
        ).exists()

        if slots_exist:
            msg = "Application has allocated time slots and cannot be rejected."
            raise GraphQLValidationError(msg, code=error_codes.CANNOT_REJECT_APPLICATION_OPTIONS)

        ReservationUnitOption.objects.filter(application_section__application=instance).update(is_rejected=True)

        return instance
