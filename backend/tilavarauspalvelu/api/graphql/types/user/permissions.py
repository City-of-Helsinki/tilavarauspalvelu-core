from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import User
from tilavarauspalvelu.typing import AnyUser

if TYPE_CHECKING:
    from query_optimizer.typing import GraphQLFilterInfo


__all__ = [
    "UserStaffPermission",
]


class UserPermission(BasePermission[User, AnyUser]):
    @classmethod
    def has_node_permission(cls, instance: User, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        return user.permissions.can_view_user(instance)

    @classmethod
    def has_filter_permission(cls, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        # For updating current user information.
        return not user.is_anonymous


class UserStaffPermission(BasePermission[User, AnyUser]):
    @classmethod
    def has_update_permission(cls, instance: User, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user != instance:  # Can only update self.
            return False
        return user.permissions.has_any_role()
