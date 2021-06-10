from datetime import datetime

from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from applications.models import Application, ApplicationRound
from reservation_units.models import ReservationUnit
from reservations.models import RecurringReservation, Reservation
from spaces.models import ServiceSector, Unit, UnitGroup


def is_superuser(user: User):
    return user.is_superuser


def has_unit_group_permission(
    user: User, unit_groups: list, required_permission: str
) -> bool:
    if not unit_groups:
        return False

    return user.unit_roles.filter(
        unit_group__in=unit_groups,
        role__permissions__permission=required_permission,
    ).exists()


def has_unit_permission(user: User, units: list, required_permission: str) -> bool:
    if not units:
        return False
    unit_groups = []
    for unit in units:
        unit_groups += list(unit.unit_groups.all())

    return user.unit_roles.filter(
        Q(unit__in=units) | Q(unit_group__in=unit_groups),
        role__permissions__permission=required_permission,
    ).exists()


def has_service_sector_permission(
    user: User, service_sectors: [ServiceSector], required_permission: str
) -> bool:
    if not service_sectors:
        return False
    return user.service_sector_roles.filter(
        service_sector__in=service_sectors,
        role__permissions__permission=required_permission,
    ).exists()


def has_general_permission(user: User, required_permission: str) -> bool:
    return user.general_roles.filter(
        role__permissions__permission=required_permission
    ).exists()


def can_manage_general_roles(user: User) -> bool:
    permission = "can_manage_general_roles"
    return has_general_permission(user, permission) or is_superuser(user)


def can_manage_service_sector_roles(user: User, service_sector: ServiceSector) -> bool:
    permission = "can_manage_service_sector_roles"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, [service_sector], permission)
    )


def can_manage_unit_roles(user: User, unit: Unit) -> bool:
    permission = "can_manage_unit_roles"
    return (
        is_superuser(user)
        or has_service_sector_permission(
            user, list(unit.service_sectors.all()), permission
        )
        or has_unit_permission(user, [unit], permission)
        or has_general_permission(user, permission)
    )


def can_manage_unit_group_roles(user: User, unit_group: UnitGroup) -> bool:
    permission = "can_manage_unit_roles"
    return (
        is_superuser(user)
        or has_unit_group_permission(user, [unit_group], permission)
        or has_general_permission(user, permission)
    )


def can_manage_units_reservation_units(user: User, unit: Unit) -> bool:
    permission = "can_manage_reservation_units"
    return (
        is_superuser(user)
        or has_service_sector_permission(
            user, list(unit.service_sectors.all()), permission
        )
        or has_unit_permission(user, [unit], permission)
        or has_general_permission(user, permission)
    )


def can_modify_reservation_unit(user: User, reservation_unit: ReservationUnit) -> bool:
    return is_superuser(user) or can_manage_units_reservation_units(
        user, reservation_unit.unit
    )


def can_handle_application(user: User, application: Application) -> bool:
    permission = "can_handle_applications"
    return (
        is_superuser(user)
        or has_service_sector_permission(
            user, [application.application_round.service_sector], permission
        )
        or has_general_permission(user, permission)
    )


def can_manage_service_sectors_application_rounds(
    user: User, service_sector: ServiceSector
) -> bool:
    permission = "can_manage_application_rounds"
    return (
        is_superuser(user)
        or (
            service_sector is not None
            and has_service_sector_permission(user, [service_sector], permission)
        )
        or has_general_permission(user, permission)
    )


def can_modify_application_round(
    user: User, application_round: ApplicationRound
) -> bool:
    return can_manage_service_sectors_application_rounds(
        user, application_round.service_sector
    )


def can_allocate_service_sector_allocations(
    user: User, service_sector: ServiceSector
) -> bool:
    permission = "can_allocate_applications"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or (
            service_sector is not None
            and has_service_sector_permission(user, [service_sector], permission)
        )
    )


def can_allocate_allocation_request(user: User, service_sector: ServiceSector) -> bool:
    permission = "can_allocate_applications"
    return (
        is_superuser(user)
        or has_service_sector_permission(user, [service_sector], permission)
        or has_general_permission(user, permission)
    )


def can_manage_service_sectors_applications(
    user: User, service_sector: ServiceSector
) -> bool:
    permission = "can_handle_applications"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, [service_sector], permission)
    )


def can_validate_unit_applications(user: User, units: [Unit]) -> bool:
    permission = "can_validate_applications"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_unit_permission(user, units, permission)
    )


def can_modify_application(user: User, application: Application) -> bool:
    return (
        is_superuser(user)
        or (
            application.user == user
            and datetime.now(tz=timezone.get_default_timezone())
            < application.application_round.application_period_end
        )
        or can_manage_service_sectors_applications(
            user, application.application_round.service_sector
        )
    )


def can_read_application(user: User, application: Application) -> bool:
    return (
        is_superuser(user)
        or (application.user == user)
        or can_manage_service_sectors_applications(
            user, application.application_round.service_sector
        )
    )


def can_modify_city(user: User):
    permission = "can_modify_cities"
    return is_superuser(user) or has_general_permission(user, permission)


def get_service_sectors_where_can_view_applications(user: User) -> list:
    permission = "can_handle_applications"
    if has_general_permission(user, permission) or is_superuser(user):
        return list(ServiceSector.objects.all())

    return list(
        map(
            lambda role: role.service_sector,
            user.service_sector_roles.filter(role__permissions__permission=permission),
        )
    )


def get_units_where_can_view_reservations(user: User) -> list:
    permission = "can_view_reservations"
    if has_general_permission(user, permission) or is_superuser(user):
        return list(Unit.objects.all())

    return list(
        map(
            lambda role: role.unit,
            user.unit_roles.filter(role__permissions__permission=permission),
        )
    )


def get_service_sectors_where_can_view_reservations(user: User) -> list:
    permission = "can_view_reservations"
    if has_general_permission(user, permission) or is_superuser(user):
        return list(ServiceSector.objects.all())
    return list(
        map(
            lambda role: role.service_sector,
            user.service_sector_roles.filter(role__permissions__permission=permission),
        )
    )


def can_view_reservation(user: User, reservation: Reservation) -> bool:
    permission = "can_view_reservations"
    reservation_units = reservation.reservation_unit.all()

    units = []
    service_sectors = []
    for reservation_unit in reservation_units:
        if reservation_unit.unit:
            units.append(reservation_unit.unit)
    for unit in units:
        service_sectors += list(unit.service_sectors.all())

    return (
        is_superuser(user)
        or reservation.user == user
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_modify_reservation(user: User, reservation: Reservation) -> bool:
    permission = "can_manage_reservations"
    reservation_units = reservation.reservation_unit.all()

    units = []
    service_sectors = []
    for reservation_unit in reservation_units:
        if reservation_unit.unit:
            units.append(reservation_unit.unit)
    for unit in units:
        service_sectors += list(unit.service_sectors.all())

    return (
        is_superuser(user)
        or reservation.user == user
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_view_recurring_reservation(
    user: User, recurring_reservation: RecurringReservation
) -> bool:
    permission = "can_view_reservations"
    res_unit_ids = recurring_reservation.reservations.values_list(
        "reservation_unit", flat=True
    )
    reservation_units = ReservationUnit.objects.filter(id__in=res_unit_ids)
    units = []
    service_sectors = []
    for reservation_unit in reservation_units:
        if reservation_unit.unit:
            units.append(reservation_unit.unit)
    for unit in units:
        service_sectors += list(unit.service_sectors.all())

    return (
        is_superuser(user)
        or recurring_reservation.user == user
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_modify_recurring_reservation(
    user: User, recurring_reservation: RecurringReservation
) -> bool:
    permission = "can_manage_reservations"
    res_unit_ids = recurring_reservation.reservations.values_list(
        "reservation_unit", flat=True
    )
    reservation_units = ReservationUnit.objects.filter(id__in=res_unit_ids)
    units = []
    service_sectors = []
    for reservation_unit in reservation_units:
        if reservation_unit.unit:
            units.append(reservation_unit.unit)
    for unit in units:
        service_sectors += list(unit.service_sectors.all())

    return (
        is_superuser(user)
        or recurring_reservation.user == user
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_manage_age_groups(user: User):
    permission = "can_manage_age_groups"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_purposes(user: User):
    permission = "can_manage_purposes"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_ability_groups(user: User):
    permission = "can_manage_ability_groups"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_reservation_unit_types(user: User):
    permission = "can_manage_reservation_unit_types"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_equipment_categories(user: User):
    permission = "can_manage_equipment_categories"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_equipment(user: User):
    permission = "can_manage_equipment"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_districts(user: User):
    permission = "can_manage_districts"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_resources(user: User):
    permission = "can_manage_resources"
    return is_superuser(user) or has_general_permission(user, permission)


def can_view_users(user: User):
    permission = "can_view_users"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_unit_permission(user, Unit.objects.all(), permission)
        or has_service_sector_permission(user, ServiceSector.objects.all(), permission)
    )
