from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from spaces.models import UnitGroup

__all__ = [
    "UnitGroupPermission",
]


class UnitGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_update_permission(cls, instance: UnitGroup, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
