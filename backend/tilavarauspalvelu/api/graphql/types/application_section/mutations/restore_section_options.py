from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import ApplicationSection, Unit, User


class RestoreAllSectionOptionsMutation(MutationType[ApplicationSection], kind="update"):
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
            msg = "No permission to restore all section options."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __after__(cls, instance: ApplicationSection, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        instance.reservation_unit_options.update(is_rejected=False)
