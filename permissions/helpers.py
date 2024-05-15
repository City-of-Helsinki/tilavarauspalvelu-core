from __future__ import annotations

from collections.abc import Iterable
from typing import TYPE_CHECKING

from django.db import models

from common.date_utils import local_datetime
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices

if TYPE_CHECKING:
    from applications.models import Application
    from common.typing import AnyUser
    from merchants.models import PaymentOrder
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

    unit_groups: list[int] = list(UnitGroup.objects.filter(units__in=units).distinct().values_list("pk", flat=True))
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
    general_permission = GeneralPermissionChoices.CAN_MANAGE_UNITS
    unit_permission = UnitPermissionChoices.CAN_MANAGE_UNITS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True

    return has_unit_permission(user, unit_permission, [unit.id])


def can_manage_units_reservation_units(user: AnyUser, unit: Unit) -> bool:
    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATION_UNITS
    unit_permission = UnitPermissionChoices.CAN_MANAGE_RESERVATION_UNITS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True

    return has_unit_permission(user, unit_permission, [unit.id])


def can_modify_reservation_unit(user: AnyUser, reservation_unit: ReservationUnit) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return can_manage_units_reservation_units(user, reservation_unit.unit)


def can_validate_unit_applications(user: AnyUser, units: list[int]) -> bool:
    general_permission = GeneralPermissionChoices.CAN_VALIDATE_APPLICATIONS
    unit_permission = UnitPermissionChoices.CAN_VALIDATE_APPLICATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True
    return has_unit_permission(user, unit_permission, units)


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
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_VIEW_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_VIEW_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user and (user.has_staff_permissions if needs_staff_permissions else True):
        return True
    if has_general_permission(user, general_permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))

    return has_unit_permission(user, unit_permission, units)


def can_modify_reservation(user: AnyUser, reservation: Reservation) -> bool:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_MANAGE_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user:
        return True
    if has_general_permission(user, general_permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))

    return has_unit_permission(user, unit_permission, units)


def can_handle_reservation(user: AnyUser, reservation: Reservation) -> bool:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_MANAGE_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    return has_unit_permission(user, unit_permission, units)


def can_comment_reservation(user: AnyUser, reservation: Reservation) -> bool:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_COMMENT_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_COMMENT_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user and user.has_staff_permissions:
        return True
    if has_general_permission(user, general_permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, unit_permission, units):
        return True

    return can_handle_reservation(user, reservation)


def can_handle_reservation_with_units(user: AnyUser, reservation_units: list[int]) -> bool:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_MANAGE_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True

    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    return has_unit_permission(user, unit_permission, units)


def can_view_recurring_reservation(user: AnyUser, recurring_reservation: RecurringReservation) -> bool:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_VIEW_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_VIEW_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if recurring_reservation.user == user:
        return True

    if has_general_permission(user, general_permission):
        return True

    reservation_units = recurring_reservation.reservations.values_list("reservation_unit", flat=True)
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    return has_unit_permission(user, unit_permission, units)


def can_modify_recurring_reservation(user: AnyUser, recurring_reservation: RecurringReservation) -> bool:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_MANAGE_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if recurring_reservation.user == user:
        return True
    if has_general_permission(user, general_permission):
        return True

    reservation_unit = recurring_reservation.reservation_unit
    units: list[int] = list(Unit.objects.filter(reservationunit__in=[reservation_unit]).values_list("pk", flat=True))
    return has_unit_permission(user, unit_permission, units)


def can_manage_age_groups(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_AGE_GROUPS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_purposes(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_PURPOSES

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_qualifiers(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_QUALIFIERS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_reservation_purposes(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATION_PURPOSES

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_ability_groups(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_ABILITY_GROUPS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_equipment_categories(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_EQUIPMENT_CATEGORIES

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_equipment(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_EQUIPMENT

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_resources(user: AnyUser, space: Space | None = None):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESOURCES
    unit_permission = UnitPermissionChoices.CAN_MANAGE_RESOURCES

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True
    if space is None:
        return False

    return has_unit_permission(user, unit_permission, [space.unit.pk])


def can_manage_spaces(user: AnyUser):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_SPACES

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


def can_manage_units_spaces(user: AnyUser, unit: Unit):
    general_permission = GeneralPermissionChoices.CAN_MANAGE_SPACES
    unit_permission = UnitPermissionChoices.CAN_MANAGE_SPACES

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True
    return has_unit_permission(user, unit_permission, [unit.pk])


def can_view_users(user: AnyUser):
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_VIEW_USERS
    unit_permission = UnitPermissionChoices.CAN_VIEW_USERS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True

    units: list[int] = list(Unit.objects.all().values_list("pk", flat=True))
    return has_unit_permission(user, unit_permission, units)


def can_refresh_order(user: AnyUser, payment_order: PaymentOrder | None) -> bool:
    general_permission = GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True
    if payment_order is None:
        return False
    return user.uuid == payment_order.reservation_user_uuid


def can_create_staff_reservation(user: AnyUser, units: list[int]) -> bool:
    general_permission = GeneralPermissionChoices.CAN_CREATE_STAFF_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_CREATE_STAFF_RESERVATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, general_permission):
        return True

    return has_unit_permission(user, unit_permission, units)


def can_manage_banner_notifications(user: AnyUser) -> bool:
    general_permission = GeneralPermissionChoices.CAN_MANAGE_NOTIFICATIONS

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, general_permission)


# HELPERS FOR FINDING OBJECTS WHERE USER HAS PERMISSIONS


def get_units_where_can_view_applications(user: AnyUser) -> models.QuerySet:
    from spaces.models import Unit

    unit_permission = UnitPermissionChoices.CAN_VALIDATE_APPLICATIONS

    if user.is_anonymous:
        return Unit.objects.none().values("id")
    if user.is_superuser:
        return Unit.objects.all().values("id")
    if has_general_permission(user, GeneralPermissionChoices.CAN_HANDLE_APPLICATIONS):
        return Unit.objects.all().values("id")
    if has_general_permission(user, GeneralPermissionChoices.CAN_VALIDATE_APPLICATIONS):
        return Unit.objects.all().values("id")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission.value in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission.value in perms]

    return (
        Unit.objects.filter(models.Q(id__in=unit_ids) | models.Q(unit_groups__in=unit_group_ids))
        .distinct()
        .values("id")
    )


def get_units_where_can_view_reservations(user: AnyUser) -> models.QuerySet:
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices.CAN_VIEW_RESERVATIONS
    unit_permission = UnitPermissionChoices.CAN_VIEW_RESERVATIONS

    if user.is_anonymous:
        return Unit.objects.none().values("pk")
    if user.is_superuser:
        return Unit.objects.all().values("pk")
    if has_general_permission(user, general_permission):
        return Unit.objects.all().values("pk")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission.value in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission.value in perms]

    return (
        Unit.objects.filter(models.Q(id__in=unit_ids) | models.Q(unit_groups__in=unit_group_ids))
        .distinct()
        .values("id")
    )


def get_units_with_permission(user: AnyUser, permission: str) -> models.QuerySet:
    """Given a permission, returns units that match to that permission on different levels"""
    from spaces.models import Unit

    general_permission = GeneralPermissionChoices(permission)

    if user.is_anonymous:
        return Unit.objects.none().values("pk")
    if user.is_superuser:
        return Unit.objects.all().values("pk")
    if has_general_permission(user, general_permission):
        return Unit.objects.all().values("pk")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if permission in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if permission in perms]

    return (
        Unit.objects.filter(models.Q(id__in=unit_ids) | models.Q(unit_groups__in=unit_group_ids))
        .distinct()
        .values("pk")
    )
