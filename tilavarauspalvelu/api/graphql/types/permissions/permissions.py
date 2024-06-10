from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser

__all__ = [
    "GeneralRolePermissionPermission",
    "ServiceSectorRolePermissionPermission",
    "UnitRolePermissionPermission",
]


class GeneralRolePermissionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False


class ServiceSectorRolePermissionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False


class UnitRolePermissionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
