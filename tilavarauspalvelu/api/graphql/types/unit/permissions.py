from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from tilavarauspalvelu.models import Unit

__all__ = [
    "UnitPermission",
]


class UnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_update_permission(cls, instance: Unit, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_unit(instance)
