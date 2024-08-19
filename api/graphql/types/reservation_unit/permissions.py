from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from api.graphql.extensions import error_codes
from common.typing import AnyUser
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
        unit = cls._get_unit(input_data)
        return user.permissions.can_manage_unit(unit)

    @classmethod
    def has_update_permission(cls, instance: ReservationUnit, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_unit(instance.unit)

    @classmethod
    def _get_unit(cls, input_data: dict[str, Any]) -> Unit:
        unit_pk = input_data.get("unit")
        if unit_pk is None:
            msg = "Unit is required for creating a Reservation Unit."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        unit = Unit.objects.filter(pk=unit_pk).first()
        if unit is None:
            msg = f"Unit with pk {unit_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return unit
