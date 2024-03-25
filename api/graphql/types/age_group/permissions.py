from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import can_manage_age_groups

__all__ = [
    "AgeGroupPermission",
]


class AgeGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_age_groups(user)
