from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo


class TaxPercentagePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False
