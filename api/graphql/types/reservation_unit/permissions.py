from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import can_manage_units_reservation_units
from reservation_units.models import ReservationUnit
from spaces.models import Unit

__all__ = [
    "ReservationUnitPermission",
]


class ReservationUnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit_pk = input_data.get("unit")
        if unit_pk is None:
            return False

        unit: Unit | None = Unit.objects.filter(pk=unit_pk).first()
        if unit is None:
            return False

        return can_manage_units_reservation_units(user, unit)

    @classmethod
    def has_update_permission(cls, instance: ReservationUnit, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_units_reservation_units(user, instance.unit)
