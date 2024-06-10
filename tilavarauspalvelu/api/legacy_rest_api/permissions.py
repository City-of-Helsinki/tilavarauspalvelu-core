from rest_framework import permissions

from permissions.helpers import (
    can_manage_units_reservation_units,
    can_modify_reservation,
    can_modify_reservation_unit,
    can_view_recurring_reservation,
    can_view_reservation,
    has_general_permission,
    has_unit_permission,
)
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices
from spaces.models import Unit


class ReservationUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        if view.action == "capacity":
            return request.user.is_authenticated

        if request.method in permissions.SAFE_METHODS:
            return True
        return can_modify_reservation_unit(request.user, reservation_unit)

    def has_permission(self, request, view):
        if request.method == "POST":
            unit_id = request.data.get("unit_id")
            try:
                unit = Unit.objects.get(pk=unit_id)
            except Unit.DoesNotExist:
                return False
            return request.user.is_authenticated and can_manage_units_reservation_units(request.user, unit)

        if view.action == "capacity":
            return request.user.is_authenticated

        return True


class ReservationPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation):
        if request.method in permissions.SAFE_METHODS:
            return can_view_reservation(request.user, reservation)
        return can_modify_reservation(request.user, reservation)

    def has_permission(self, request, view):
        return request.user.is_authenticated


class RecurringReservationPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, recurring_reservation):
        if request.method in permissions.SAFE_METHODS:
            return can_view_recurring_reservation(request.user, recurring_reservation)

        if request.user.is_anonymous:
            return False
        if request.user.is_superuser:
            return True
        if recurring_reservation.user == request.user:
            return True
        if has_general_permission(request.user, GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS):
            return True

        return has_unit_permission(
            request.user,
            UnitPermissionChoices.CAN_MANAGE_RESERVATIONS,
            [recurring_reservation.reservation_unit.unit.id],
        )

    def has_permission(self, request, view):
        return request.user.is_authenticated
