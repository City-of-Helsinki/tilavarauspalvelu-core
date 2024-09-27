from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import AllocatedTimeSlot, ReservationUnitOption
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "AllocatedTimeSlotPermission",
]


class AllocatedTimeSlotPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.permissions.has_any_role()

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = cls._get_option(input_data).reservation_unit.unit
        return user.permissions.can_manage_applications_for_units([unit])

    @classmethod
    def has_update_permission(cls, instance: AllocatedTimeSlot, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = instance.reservation_unit_option.reservation_unit.unit
        return user.permissions.can_manage_applications_for_units([unit])

    @classmethod
    def has_delete_permission(cls, instance: AllocatedTimeSlot, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = instance.reservation_unit_option.reservation_unit.unit
        return user.permissions.can_manage_applications_for_units([unit])

    @classmethod
    def _get_option(cls, input_data: dict[str, Any]) -> ReservationUnitOption:
        option_pk = input_data.get("reservation_unit_option")
        if option_pk is None:
            msg = "Reservation Unit Option is required for creating an Allocated Time Slot."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        option = ReservationUnitOption.objects.select_related("reservation_unit__unit").filter(pk=option_pk).first()
        if option is None:
            msg = f"Reservation Unit Option with pk {option_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return option
