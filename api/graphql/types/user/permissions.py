from __future__ import annotations

from typing import Any

from graphene_django_extensions.permissions import BasePermission
from query_optimizer.typing import GraphQLFilterInfo

from common.typing import AnyUser
from permissions.helpers import can_view_users
from users.models import User

__all__ = [
    "UserPermission",
]


class UserPermission(BasePermission):
    @classmethod
    def has_node_permission(cls, instance: User, user: AnyUser, filters: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        return instance == user or can_view_users(user)

    @classmethod
    def has_filter_permission(cls, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False

    @classmethod
    def has_update_permission(cls, instance: User, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user != instance:
            return False
        return user.has_staff_permissions
