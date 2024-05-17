from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from api.graphql.extensions import error_codes
from common.typing import AnyUser
from permissions.helpers import (
    can_create_staff_reservation,
    can_handle_reservation,
    can_modify_reservation,
    has_general_permission,
    has_unit_permission,
)
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices
from reservation_units.models import ReservationUnit
from reservations.models import Reservation

__all__ = [
    "ReservationCommentPermission",
    "ReservationDenyPermission",
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
        return can_modify_reservation(user, instance)

    @classmethod
    def has_delete_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_modify_reservation(user, instance)


class ReservationHandlingPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if can_handle_reservation(user, instance):
            return True
        if instance.user != user:
            return False

        units = list(instance.reservation_unit.values_list("unit", flat=True))
        return can_create_staff_reservation(user, units)


class ReservationDenyPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if can_handle_reservation(user, instance):
            return True
        if instance.user != user:
            return False

        units = list(instance.reservation_unit.values_list("unit", flat=True))
        return can_create_staff_reservation(user, units)


class ReservationRefundPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_handle_reservation(user, instance)


class StaffAdjustTimePermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if can_handle_reservation(user, instance):
            return True
        if instance.user != user:
            return False

        units = list(instance.reservation_unit.values_list("unit", flat=True))
        return can_create_staff_reservation(user, units)


class StaffReservationModifyPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if can_modify_reservation(user, instance):
            return True
        if instance.user != user:
            return False

        units = list(instance.reservation_unit.values_list("unit", flat=True))
        return can_create_staff_reservation(user, units)


class ReservationCommentPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Reservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        if instance.user == user and user.has_staff_permissions:
            return True
        if has_general_permission(user, GeneralPermissionChoices.CAN_COMMENT_RESERVATIONS):
            return True

        units = list(instance.reservation_unit.values_list("unit", flat=True))
        if has_unit_permission(user, UnitPermissionChoices.CAN_COMMENT_RESERVATIONS, units):
            return True

        return can_handle_reservation(user, instance)


class ReservationStaffCreatePermission(BasePermission):
    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        ids = input_data.get("reservation_unit_pks")
        if ids is None:
            msg = "Reservation Units are required for creating Staff Reservations."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        units = list(ReservationUnit.objects.filter(id__in=ids).values_list("unit", flat=True).distinct())
        return can_create_staff_reservation(user, units)
