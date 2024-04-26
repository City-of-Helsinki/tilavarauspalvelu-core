from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from api.graphql.extensions import error_codes
from applications.models import AllocatedTimeSlot, ReservationUnitOption
from common.typing import AnyUser
from permissions.helpers import can_manage_service_sectors_applications

__all__ = [
    "AllocatedTimeSlotPermission",
]


class AllocatedTimeSlotPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        return user.has_staff_permissions

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        if not user.has_staff_permissions:
            return False

        option_pk: int | None = input_data.get("reservation_unit_option")
        if option_pk is None:
            msg = "Reservation Unit Option is required for creating an Allocated Time Slot."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        option: ReservationUnitOption | None = (
            ReservationUnitOption.objects.filter(pk=option_pk)
            .select_related("application_section__application__application_round__service_sector")
            .first()
        )
        if not option:
            msg = f"Reservation Unit Option with pk {option_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        sector = option.application_section.application.application_round.service_sector
        return can_manage_service_sectors_applications(user, sector)

    @classmethod
    def has_delete_permission(cls, instance: AllocatedTimeSlot, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        if not user.has_staff_permissions:
            return False

        sector = instance.reservation_unit_option.application_section.application.application_round.service_sector
        return can_manage_service_sectors_applications(user, sector)
