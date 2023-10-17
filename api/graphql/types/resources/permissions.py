from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_manage_resources
from spaces.models import Space


class ResourcePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        space = Space.objects.filter(id=input.get("space_pk")).first()

        return can_manage_resources(info.context.user, space=space)
