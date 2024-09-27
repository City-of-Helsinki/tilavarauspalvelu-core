from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import Reservation, ReservationUnit
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ReservationCommentPermission",
    "ReservationHandlingPermission",
    "ReservationPermission",
    "ReservationRefundPermission",
    "ReservationStaffCreatePermission",
    "StaffAdjustTimePermission",
    "StaffReservationModifyPermission",
]


class ReservationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.is_authenticated

    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation(instance)

    @classmethod
    def has_delete_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation(instance)


class ReservationHandlingPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        )


class ReservationRefundPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation(instance, reserver_needs_role=True)


class StaffAdjustTimePermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        )


class StaffReservationModifyPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        )


class ReservationCommentPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_view_reservation(instance, reserver_needs_role=True)


class ReservationStaffCreatePermission(BasePermission):
    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        reservation_unit = cls._get_reservation_unit(input_data)
        return user.permissions.can_create_staff_reservation(reservation_unit)

    @classmethod
    def _get_reservation_unit(cls, input_data: dict[str, Any]) -> ReservationUnit:
        ids = input_data.get("reservation_unit_pks")
        if ids is None:
            msg = "Reservation Units are required for creating Staff Reservations."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        # Simplified since currently we only ever add one reservation unit to a reservation.
        reservation_unit = ReservationUnit.objects.select_related("unit").filter(id=ids[0]).first()
        if reservation_unit is None:
            msg = f"Reservation Unit with pk {ids[0]} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return reservation_unit
