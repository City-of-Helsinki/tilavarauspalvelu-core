from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_manage_units_reservation_units


class ApplicationRoundTimeSlotPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        user = info.context.user
        unit = root.reservation_unit.unit
        return can_manage_units_reservation_units(user, unit)
