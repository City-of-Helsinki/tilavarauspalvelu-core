from __future__ import annotations

from typing import TYPE_CHECKING, Any

from undine import Input, MutationType
from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice
from tilavarauspalvelu.models import ApplicationSection

if TYPE_CHECKING:
    from undine.typing import TModel

    from tilavarauspalvelu.typing import GQLInfo


class ApplicationSectionDeleteMutation(MutationType[ApplicationSection], auto=False):
    pk = Input()

    @classmethod
    def __permissions__(cls, instance: TModel, info: GQLInfo, input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_application(instance.application):
            msg = "You do not have permission to manage this application."
            raise GraphQLValidationError(msg)

    @classmethod
    def __validate__(cls, instance: ApplicationSection, info: GQLInfo, input_data: dict[str, Any]) -> None:
        status = ApplicationSectionStatusChoice(instance.status)
        if not status.can_delete:
            msg = "Application section has been allocated and cannot be deleted anymore."
            raise GraphQLValidationError(msg)
