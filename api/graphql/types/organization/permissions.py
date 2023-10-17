from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo


class OrganisationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        user = info.context.user
        return user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict[str, Any]) -> bool:
        return False
