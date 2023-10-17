from typing import Any

from graphene_permissions.permissions import BasePermission

from applications.models import ApplicationEventSchedule
from common.typing import GQLInfo
from permissions.helpers import can_manage_service_sectors_applications, user_has_staff_permissions


class ApplicationEventScheduleAllocationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return user_has_staff_permissions(info.context.user)

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict[str, Any]) -> bool:
        if not user_has_staff_permissions(info.context.user):
            return False

        pk: int | None = input.get("pk")
        if not pk:
            return False

        schedule = ApplicationEventSchedule.objects.get(pk=pk)
        service_sector = schedule.application_event.application.application_round.service_sector

        return can_manage_service_sectors_applications(info.context.user, service_sector)
