from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "UnitGroupPermission",
]


class UnitGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.permissions.has_any_role()

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
