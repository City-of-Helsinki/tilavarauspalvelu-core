from typing import Any

from graphene_django_extensions.permissions import BasePermission

from applications.models import ReservationUnitOption
from common.typing import AnyUser
from permissions.helpers import can_manage_service_sectors_applications

__all__ = [
    "ReservationUnitOptionPermission",
]


class ReservationUnitOptionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        return user.has_staff_permissions

    @classmethod
    def has_update_permission(cls, instance: ReservationUnitOption, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        if not user.has_staff_permissions:
            return False

        sector = instance.application_section.application.application_round.service_sector
        return can_manage_service_sectors_applications(user, sector)
