from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import AllocatedTimeSlot, ApplicationSection, Unit, User
from tilavarauspalvelu.typing import error_codes


class RejectAllSectionOptionsMutation(MutationType[ApplicationSection], kind="update"):
    pk = Input()

    @classmethod
    def __permissions__(cls, instance: ApplicationSection, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        units = (
            Unit.objects.filter(reservation_units__reservation_unit_options__application_section=instance)
            .prefetch_related("unit_groups")
            .distinct()
        )
        if not user.permissions.can_manage_applications_for_units(units):
            msg = "No permission to reject all section options."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationSection, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        slots_exist = AllocatedTimeSlot.objects.filter(reservation_unit_option__application_section=instance).exists()

        if slots_exist:
            msg = "Application section has allocated time slots and cannot be rejected."
            raise GraphQLValidationError(msg, code=error_codes.CANNOT_REJECT_SECTION_OPTIONS)

    @classmethod
    def __after__(cls, instance: ApplicationSection, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        instance.reservation_unit_options.update(is_rejected=True)
