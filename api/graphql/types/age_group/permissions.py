from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_manage_age_groups


class AgeGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_age_groups(info.context.user)
