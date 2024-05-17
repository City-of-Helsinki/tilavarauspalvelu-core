from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import has_general_permission
from permissions.models import GeneralPermissionChoices

__all__ = [
    "AbilityGroupPermission",
]


class AbilityGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True

        general_permission = GeneralPermissionChoices.CAN_MANAGE_ABILITY_GROUPS
        return has_general_permission(user, general_permission)
