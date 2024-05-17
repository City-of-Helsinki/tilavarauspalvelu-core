from __future__ import annotations

from collections.abc import Iterable
from typing import TYPE_CHECKING

from common.date_utils import local_datetime
from common.typing import AnyUser
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices

if TYPE_CHECKING:
    from applications.models import Application
    from reservation_units.models import ReservationUnit
    from reservations.models import RecurringReservation, Reservation
    from spaces.models import Space, Unit


def has_general_permission(user: AnyUser, required_permission: GeneralPermissionChoices) -> bool:
    if user.is_anonymous:
        return False
    return required_permission in user.general_permissions


def has_any_general_permission(user: AnyUser, permissions: Iterable[GeneralPermissionChoices]) -> bool:
    if user.is_anonymous:
        return False
    return any(permission in user.general_permissions for permission in permissions)


def has_all_general_permissions(user: AnyUser, permissions: Iterable[GeneralPermissionChoices]) -> bool:
    if user.is_anonymous:
        return False
    return all(permission in user.general_permissions for permission in permissions)


def has_unit_permission(user: AnyUser, required_permission: UnitPermissionChoices, units: list[int]) -> bool:
    from spaces.models import UnitGroup

    if user.is_anonymous:
        return False
    for unit in units:
        if required_permission in user.unit_permissions.get(unit, []):
            return True

    unit_groups: list[int] = list(UnitGroup.objects.filter(units__in=units).values_list("pk", flat=True).distinct())
    return has_unit_group_permission(user, required_permission, unit_groups)


def has_unit_group_permission(
    user: AnyUser,
    required_permission: UnitPermissionChoices,
    unit_groups: list[int],
) -> bool:
    if user.is_anonymous:
        return False
    return any(required_permission in user.unit_group_permissions.get(unit_group, []) for unit_group in unit_groups)


def can_manage_units(user: AnyUser, unit: Unit) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_UNITS):
        return True

    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_UNITS, [unit.id])


def can_manage_units_reservation_units(user: AnyUser, unit: Unit) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESERVATION_UNITS):
        return True

    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_RESERVATION_UNITS, [unit.id])


def can_modify_reservation_unit(user: AnyUser, reservation_unit: ReservationUnit) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return can_manage_units_reservation_units(user, reservation_unit.unit)


def can_validate_unit_applications(user: AnyUser, units: list[int]) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_VALIDATE_APPLICATIONS):
        return True
    return has_unit_permission(user, UnitPermissionChoices.CAN_VALIDATE_APPLICATIONS, units)


def can_modify_application(user: AnyUser, application: Application) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if application.user == user and local_datetime() < application.application_round.application_period_end:
        return True

    if has_general_permission(user, GeneralPermissionChoices.CAN_HANDLE_APPLICATIONS):
        return True

    units: list[int] = list(application.units.values_list("pk", flat=True))
    return has_unit_permission(user, UnitPermissionChoices.CAN_HANDLE_APPLICATIONS, units)


def can_read_application(user: AnyUser, application: Application) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if application.user == user:
        return True

    if has_general_permission(user, GeneralPermissionChoices.CAN_HANDLE_APPLICATIONS):
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_VALIDATE_APPLICATIONS):
        return True

    units: list[int] = list(application.units.values_list("pk", flat=True))
    if has_unit_permission(user, UnitPermissionChoices.CAN_HANDLE_APPLICATIONS, units):
        return True

    return has_unit_permission(user, UnitPermissionChoices.CAN_VALIDATE_APPLICATIONS, units)


def can_access_application_private_fields(user: AnyUser, application: Application) -> bool:
    units = list(application.units.values_list("pk", flat=True))
    return can_validate_unit_applications(user, units)


def can_view_reservation(user: AnyUser, reservation: Reservation, needs_staff_permissions: bool = False) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user and (user.has_staff_permissions if needs_staff_permissions else True):
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_VIEW_RESERVATIONS):
        return True

    units = list(reservation.reservation_unit.values_list("unit", flat=True).distinct())
    return has_unit_permission(user, UnitPermissionChoices.CAN_VIEW_RESERVATIONS, units)


def can_modify_reservation(user: AnyUser, reservation: Reservation) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS):
        return True

    units = list(reservation.reservation_unit.values_list("unit", flat=True).distinct())
    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_RESERVATIONS, units)


def can_handle_reservation(user: AnyUser, reservation: Reservation) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS):
        return True

    units = list(reservation.reservation_unit.values_list("unit", flat=True).distinct())
    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_RESERVATIONS, units)


def can_handle_reservation_with_units(user: AnyUser, reservation_units: list[int]) -> bool:
    from spaces.models import Unit

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS):
        return True

    units = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True).distinct())
    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_RESERVATIONS, units)


def can_view_recurring_reservation(user: AnyUser, recurring_reservation: RecurringReservation) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if recurring_reservation.user == user:
        return True

    if has_general_permission(user, GeneralPermissionChoices.CAN_VIEW_RESERVATIONS):
        return True

    units = list(recurring_reservation.reservations.values_list("reservation_unit__unit", flat=True).distinct())
    return has_unit_permission(user, UnitPermissionChoices.CAN_VIEW_RESERVATIONS, units)


def can_manage_resources(user: AnyUser, space: Space | None = None):
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESOURCES):
        return True
    if space is None:
        return False

    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_RESOURCES, [space.unit.pk])


def can_manage_spaces(user: AnyUser):
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_SPACES)


def can_manage_units_spaces(user: AnyUser, unit: Unit):
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_SPACES):
        return True
    return has_unit_permission(user, UnitPermissionChoices.CAN_MANAGE_SPACES, [unit.pk])


def can_view_users(user: AnyUser):
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_VIEW_USERS):
        return True

    for perms in user.unit_permissions.values():
        if UnitPermissionChoices.CAN_VIEW_USERS in perms:
            return True

    return any(UnitPermissionChoices.CAN_VIEW_USERS in perms for perms in user.unit_group_permissions.values())


def can_create_staff_reservation(user: AnyUser, units: list[int]) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, GeneralPermissionChoices.CAN_CREATE_STAFF_RESERVATIONS):
        return True

    return has_unit_permission(user, UnitPermissionChoices.CAN_CREATE_STAFF_RESERVATIONS, units)


def can_manage_banner_notifications(user: AnyUser) -> bool:
    general_permission = GeneralPermissionChoices.CAN_MANAGE_NOTIFICATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)
