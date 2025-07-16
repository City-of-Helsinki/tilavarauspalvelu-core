from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Application, ReservationUnitOption

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "RestoreAllApplicationOptionsMutation",
]


class RestoreAllApplicationOptionsMutation(MutationType[Application], auto=False):
    pk = Input()

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance, reserver_needs_role=True, all_units=True):
            msg = "No permission to restore all application options."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __mutate__(cls, instance: Application, info: GQLInfo, input_data: dict[str, Any]) -> Application:
        ReservationUnitOption.objects.filter(application_section__application=instance).update(is_rejected=False)
        return instance
