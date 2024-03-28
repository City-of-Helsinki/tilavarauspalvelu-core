from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import can_manage_equipment_categories

__all__ = [
    "EquipmentCategoryPermission",
]


class EquipmentCategoryPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_equipment_categories(user)
