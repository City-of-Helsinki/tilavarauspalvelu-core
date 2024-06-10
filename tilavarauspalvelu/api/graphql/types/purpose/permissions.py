from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import has_general_permission
from permissions.models import GeneralPermissionChoices

__all__ = [
    "PurposePermission",
]


class PurposePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True

        return has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_PURPOSES)
