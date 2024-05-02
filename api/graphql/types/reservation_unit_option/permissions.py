from typing import Any

from graphene_django_extensions.permissions import BasePermission

from applications.models import ReservationUnitOption
from common.typing import AnyUser
from permissions.helpers import has_general_permission, has_unit_permission

__all__ = [
    "ReservationUnitOptionPermission",
]

from permissions.models import GeneralPermissionChoices, UnitPermissionChoices


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
        if has_general_permission(user, GeneralPermissionChoices.CAN_HANDLE_APPLICATIONS):
            return True

        perm = UnitPermissionChoices.CAN_HANDLE_APPLICATIONS
        return has_unit_permission(user, perm, [instance.reservation_unit.unit.id])
