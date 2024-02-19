from __future__ import annotations

from typing import Any

from graphene_django_extensions.permissions import BasePermission as NewBasePermission
from graphene_permissions.permissions import BasePermission

from common.typing import AnyUser, GQLInfo
from permissions.helpers import can_view_users
from users.models import User


class UserPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return can_view_users(info.context.user)

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        user = info.context.user
        if user.is_anonymous:
            return False

        if "pk" not in input:
            return False

        if user.pk != input["pk"]:
            return False

        if user.has_staff_permissions:
            return True

        return False


class ApplicantPermission(NewBasePermission):
    @classmethod
    def has_node_permission(cls, instance: User, user: AnyUser, filters: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False

        return instance.pk == user.pk or can_view_users(user)
