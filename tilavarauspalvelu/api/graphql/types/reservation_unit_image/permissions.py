from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from reservation_units.models import ReservationUnit, ReservationUnitImage
from spaces.models import Unit
from tilavarauspalvelu.api.graphql.extensions import error_codes

__all__ = [
    "ReservationUnitImagePermission",
]


class ReservationUnitImagePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = cls._get_unit(input_data)
        return user.permissions.can_manage_unit(unit)

    @classmethod
    def has_update_permission(cls, instance: ReservationUnitImage, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = instance.reservation_unit.unit
        return user.permissions.can_manage_unit(unit)

    @classmethod
    def has_delete_permission(cls, instance: ReservationUnitImage, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = instance.reservation_unit.unit
        return user.permissions.can_manage_unit(unit)

    @classmethod
    def _get_unit(cls, input_data: dict[str, Any]) -> Unit:
        reservation_unit_pk = input_data.get("reservation_unit")
        if reservation_unit_pk is None:
            msg = "Reservation Unit is required for creating a Reservation Unit Image."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).select_related("unit").first()
        if reservation_unit is None:
            msg = f"Reservation Unit {reservation_unit_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        if reservation_unit.unit is None:
            msg = f"Reservation Unit {reservation_unit_pk} does not have a unit."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return reservation_unit.unit
