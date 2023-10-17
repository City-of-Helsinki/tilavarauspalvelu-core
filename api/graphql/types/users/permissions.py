from typing import Any

from django.contrib.auth import get_user_model
from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_view_user, can_view_users

User = get_user_model()


class ApplicantPermission(BasePermission):
    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: int) -> bool:
        return can_view_user(info.context.user, id)


class UserPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        user = info.context.user

        if user is None:
            return False
        return can_view_users(user)

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

        service_sector_roles = user.service_sector_roles.all()
        unit_roles = user.unit_roles.all()
        general_roles = user.general_roles.all()

        if user.is_superuser or service_sector_roles.exists() or unit_roles.exists() or general_roles.exists():
            return True

        return False
