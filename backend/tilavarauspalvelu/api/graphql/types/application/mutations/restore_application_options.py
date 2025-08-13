from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.models import Application, ReservationUnitOption, User

__all__ = [
    "RestoreAllApplicationOptionsMutation",
]


class RestoreAllApplicationOptionsMutation(MutationType[Application]):
    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, root: Any, info: GQLInfo[User], input_data: Any) -> Application:
        instance = get_instance_or_raise(model=Application, pk=input_data["pk"])

        user = info.context.user
        if not user.permissions.can_manage_application(instance, reserver_needs_role=True, all_units=True):
            msg = "No permission to restore all application options."
            raise GraphQLPermissionError(msg)

        ReservationUnitOption.objects.filter(application_section__application=instance).update(is_rejected=False)

        return instance
