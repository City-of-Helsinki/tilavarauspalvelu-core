from typing import Any

from graphene_django_extensions.permissions import BasePermission

from applications.models import ReservationUnitOption
from common.typing import AnyUser

__all__ = [
    "ReservationUnitOptionPermission",
]


class ReservationUnitOptionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.permissions.has_any_role()

    @classmethod
    def has_update_permission(cls, instance: ReservationUnitOption, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_applications_for_units([instance.reservation_unit.unit])
