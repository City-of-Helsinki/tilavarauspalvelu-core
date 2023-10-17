from typing import Any

from graphene_permissions.permissions import BasePermission

from applications.models import Application, ApplicationEvent
from common.typing import GQLInfo
from permissions.helpers import can_manage_service_sectors_applications, can_modify_application


class ApplicationEventPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict[str, Any]) -> bool:
        pk: int | None = input.get("pk")
        application_pk: int | None = input.get("application")
        application: Application | None = None

        if pk:
            application_event = ApplicationEvent.objects.filter(id=pk).first()
            if application_event is None:
                return False

            application = application_event.application

        elif application_pk:
            application = Application.objects.filter(id=application_pk).first()
            if application is None:
                return False

        if application is None:
            return False

        return can_modify_application(info.context.user, application)


class ApplicationEventDeclinePermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict[str, Any]) -> bool:
        pk = input.get("pk")
        if not pk:
            return False

        event = ApplicationEvent.objects.filter(id=pk).first()
        if not event:
            return False

        return can_manage_service_sectors_applications(
            info.context.user, event.application.application_round.service_sector
        )
