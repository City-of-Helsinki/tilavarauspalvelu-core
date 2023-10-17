from typing import Any

from graphene_permissions.permissions import BasePermission

from applications.models import Application
from common.typing import GQLInfo
from permissions.helpers import can_manage_service_sectors_applications, can_modify_application, can_read_application


class ApplicationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        user = info.context.user
        application = Application.objects.filter(id=id).first()

        if application:
            return user.is_authenticated and can_read_application(user, application)

        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")

        if pk:
            application = Application.objects.filter(id=pk).first()
            if not application:
                return False
            return can_modify_application(info.context.user, application)

        return cls.has_permission(info)


class ApplicationDeclinePermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict[str, Any]) -> bool:
        pk: int | None = input.get("pk")
        if not pk:
            return False

        application: Application | None = Application.objects.filter(id=pk).first()
        if not application:
            return False

        return can_manage_service_sectors_applications(info.context.user, application.application_round.service_sector)
