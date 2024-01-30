from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import (
    can_manage_units_reservation_units,
)
from reservation_units.models import ReservationUnit
from spaces.models import Unit


class ReservationUnitHaukiUrlPermission(BasePermission):
    """Check permissions in resolver level. Cannot figure out the permissions without knowing unit."""

    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return False

    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class ReservationUnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        unit_pk = input.get("unit_pk")
        pk = input.get("pk")
        if not unit_pk:
            unit_pk = getattr(ReservationUnit.objects.filter(pk=pk).first(), "unit_id", None)
        if not unit_pk:
            return False
        unit = Unit.objects.filter(id=unit_pk).first()
        return can_manage_units_reservation_units(info.context.user, unit)
