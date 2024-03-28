from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import can_manage_units_reservation_units
from reservation_units.models import ReservationUnitImage
from spaces.models import Unit

__all__ = [
    "ReservationUnitImagePermission",
]


class ReservationUnitImagePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return False

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        reservation_unit_pk: int | None = input_data.get("reservation_unit")
        if not reservation_unit_pk:
            return False
        unit: Unit | None = Unit.objects.filter(reservationunit=reservation_unit_pk).first()
        if not unit:
            return False
        return can_manage_units_reservation_units(user, unit)

    @classmethod
    def has_update_permission(cls, instance: ReservationUnitImage, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_units_reservation_units(user, instance.reservation_unit.unit)

    @classmethod
    def has_delete_permission(cls, instance: ReservationUnitImage, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_units_reservation_units(user, instance.reservation_unit.unit)
