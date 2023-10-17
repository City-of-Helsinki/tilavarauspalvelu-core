from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_manage_spaces, can_manage_units_spaces
from spaces.models import Unit


class ServiceSectorPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class SpacePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        unit = None

        space_id = input.get("pk")
        unit_id = input.get("unit_pk")
        operation = getattr(info.operation, "name", None)

        if getattr(operation, "value", None) == "createSpace" and unit_id:
            unit = Unit.objects.filter(id=unit_id).first()
        elif space_id:
            unit = Unit.objects.filter(spaces=space_id).first()

        if unit:
            return can_manage_units_spaces(info.context.user, unit)

        return can_manage_spaces(info.context.user)
