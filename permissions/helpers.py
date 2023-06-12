from datetime import datetime
from typing import Iterable, List, Optional, Union

from django.db.models import Q, QuerySet
from django.utils import timezone

from applications.models import Application, ApplicationRound
from merchants.models import PaymentOrder
from reservation_units.models import ReservationUnit
from reservations.models import RecurringReservation, Reservation
from spaces.models import ServiceSector, Unit, UnitGroup
from users.models import User


def is_superuser(user: User) -> bool:
    if user.is_anonymous:
        return False

    return user.is_superuser


def has_unit_group_permission(
    user: User, unit_groups: Union[List[int], QuerySet], required_permission: str
) -> bool:
    if not unit_groups:
        return False

    return user.unit_roles.filter(
        unit_group__in=unit_groups,
        role__permissions__permission=required_permission,
    ).exists()


def has_unit_permission(
    user: User, units: Union[List[int], QuerySet], required_permission: str
) -> bool:
    if not units or user.is_anonymous:
        return False

    unit_groups = UnitGroup.objects.filter(units__in=units)

    return user.unit_roles.filter(
        Q(unit__in=units) | Q(unit_group__in=unit_groups),
        role__permissions__permission=required_permission,
    ).exists()


def has_service_sector_permission(
    user: User, service_sectors: Union[List[int], QuerySet], required_permission: str
) -> bool:
    if not service_sectors or user.is_anonymous:
        return False
    return user.service_sector_roles.filter(
        service_sector__in=service_sectors,
        role__permissions__permission=required_permission,
    ).exists()


def has_general_permission(user: User, required_permission: str) -> bool:
    if user.is_anonymous:
        return False
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
        or has_service_sector_permission(user, [service_sector.id], permission)
    )


def can_manage_unit_roles(user: User, units: Union[List[Unit], QuerySet]) -> bool:
    permission = "can_manage_unit_roles"
    service_sectors = ServiceSector.objects.filter(units__in=units)
    return (
        is_superuser(user)
        or has_service_sector_permission(user, service_sectors.all(), permission)
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
    )


def can_manage_units(user: User, unit: Unit) -> bool:
    permission = "can_manage_units"
    if user.is_anonymous:
        return False
    return (
        is_superuser(user)
        or has_service_sector_permission(user, unit.service_sectors.all(), permission)
        or has_unit_permission(user, [unit.id], permission)
        or has_general_permission(user, permission)
    )


def can_manage_unit_group_roles(
    user: User, unit_group: Union[List[int], QuerySet]
) -> bool:
    permission = "can_manage_unit_roles"
    return (
        is_superuser(user)
        or has_unit_group_permission(user, unit_group, permission)
        or has_general_permission(user, permission)
    )


def can_manage_units_reservation_units(user: User, unit: Unit) -> bool:
    permission = "can_manage_reservation_units"
    return (
        is_superuser(user)
        or has_service_sector_permission(user, unit.service_sectors.all(), permission)
        or has_unit_permission(user, [unit.id], permission)
        or has_general_permission(user, permission)
    )


def can_modify_reservation_unit(user: User, reservation_unit: ReservationUnit) -> bool:
    return (
        user.is_authenticated
        and is_superuser(user)
        or can_manage_units_reservation_units(user, reservation_unit.unit)
    )


def can_handle_application(user: User, application: Application) -> bool:
    permission = "can_handle_applications"
    return (
        is_superuser(user)
        or has_service_sector_permission(
            user, [application.application_round.service_sector.id], permission
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
            and has_service_sector_permission(user, [service_sector.id], permission)
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
            and has_service_sector_permission(user, [service_sector.id], permission)
        )
    )


def can_allocate_allocation_request(user: User, service_sector: ServiceSector) -> bool:
    permission = "can_allocate_applications"
    return (
        is_superuser(user)
        or has_service_sector_permission(user, [service_sector.id], permission)
        or has_general_permission(user, permission)
    )


def can_manage_service_sectors_applications(
    user: User, service_sector: ServiceSector
) -> bool:
    permission = "can_handle_applications"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, [service_sector.id], permission)
    )


def can_validate_unit_applications(user: User, units: Iterable[Unit]) -> bool:
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
        or can_validate_unit_applications(user, application.units)
    )


def can_modify_city(user: User):
    permission = "can_modify_cities"
    return is_superuser(user) or has_general_permission(user, permission)


def get_service_sectors_where_can_view_applications(user: User) -> QuerySet:
    permission = "can_handle_applications"

    if has_general_permission(user, permission) or is_superuser(user):
        return ServiceSector.objects.all().values_list("id", flat=True)

    return user.service_sector_roles.filter(
        role__permissions__permission=permission
    ).values_list("service_sector__id", flat=True)


def get_units_where_can_view_reservations(user: User) -> QuerySet:
    permission = "can_view_reservations"

    if user.is_anonymous:
        return Unit.objects.none()

    if has_general_permission(user, permission) or is_superuser(user):
        return Unit.objects.all()

    units = user.unit_roles.filter(
        role__permissions__permission=permission
    ).values_list("unit", flat=True)
    unit_groups = user.unit_roles.filter(
        role__permissions__permission=permission
    ).values_list("unit_group")

    units = (
        Unit.objects.filter(Q(unit_groups__in=unit_groups) | Q(id__in=units))
        .distinct()
        .values_list("id", flat=True)
    )

    return units


def get_service_sectors_where_can_view_reservations(user: User) -> list:
    permission = "can_view_reservations"

    if user.is_anonymous:
        return []

    if has_general_permission(user, permission) or is_superuser(user):
        return ServiceSector.objects.all()

    return user.service_sector_roles.filter(
        role__permissions__permission=permission
    ).values_list("service_sector", flat=True)


def can_view_reservation(
    user: User, reservation: Reservation, needs_staff_permissions: bool = False
) -> bool:
    permission = "can_view_reservations"
    reservation_units = reservation.reservation_unit.all()

    if user.is_anonymous:
        return False

    units = Unit.objects.filter(reservationunit__in=reservation_units)
    service_sectors = ServiceSector.objects.filter(units__in=units)

    own_reservation = reservation.user == user

    if needs_staff_permissions:
        own_reservation = own_reservation and user.has_staff_permissions

    return (
        is_superuser(user)
        or own_reservation
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_create_reservation(user):
    """Reservation creation by end user."""
    return user.is_authenticated


def can_modify_reservation(user: User, reservation: Reservation) -> bool:
    permission = "can_manage_reservations"
    reservation_units = reservation.reservation_unit.all()

    units = Unit.objects.filter(reservationunit__in=reservation_units)
    service_sectors = ServiceSector.objects.filter(units__in=units)

    return (
        is_superuser(user)
        or reservation.user == user
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_handle_reservation(user: User, reservation: Reservation) -> bool:
    permission = "can_manage_reservations"
    reservation_units = reservation.reservation_unit.all()

    units = Unit.objects.filter(reservationunit__in=reservation_units)
    service_sectors = ServiceSector.objects.filter(units__in=units)

    return (
        is_superuser(user)
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_comment_reservation(user: User, reservation: Reservation) -> bool:
    permission = "can_comment_reservations"
    units = Unit.objects.filter(reservationunit__in=reservation.reservation_unit.all())
    service_sectors = ServiceSector.objects.filter(units__in=units)

    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
        or has_unit_permission(user, units, permission)
        or can_handle_reservation(user, reservation)
        or (user.has_staff_permissions and reservation.user == user)
    )


def can_handle_reservation_with_units(
    user: User, reservation_unit_ids: List[int]
) -> bool:
    permission = "can_manage_reservations"
    reservation_units = ReservationUnit.objects.filter(pk__in=reservation_unit_ids)

    units = Unit.objects.filter(reservationunit__in=reservation_units)
    service_sectors = ServiceSector.objects.filter(units__in=units)

    return (
        is_superuser(user)
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )


def can_view_recurring_reservation(
    user: User, recurring_reservation: RecurringReservation
) -> bool:
    permission = "can_view_reservations"

    if user.is_anonymous:
        return False
    res_unit_ids = recurring_reservation.reservations.values_list(
        "reservation_unit", flat=True
    )
    reservation_units = ReservationUnit.objects.filter(id__in=res_unit_ids)
    units = Unit.objects.filter(reservationunit__in=reservation_units)
    service_sectors = ServiceSector.objects.filter(units__in=units)

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
    res_unit = recurring_reservation.reservation_unit
    units = Unit.objects.filter(reservationunit=res_unit)
    service_sectors = ServiceSector.objects.filter(units__in=units)

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


def can_manage_qualifiers(user: User):
    permission = "can_manage_qualifiers"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_reservation_purposes(user: User):
    permission = "can_manage_reservation_purposes"
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


def can_manage_resources(user: User, space=None):
    permission = "can_manage_resources"
    return (
        # Is general admin
        (is_superuser(user) or has_general_permission(user, permission))
        or space
        # Or has unit or service sector permissions related to the space where the resource ought to be.
        and (
            has_unit_permission(user, [space.unit], permission)
            or has_service_sector_permission(
                user, space.unit.service_sectors.all(), permission
            )
        )
    )


def can_manage_spaces(user: User):
    permission = "can_manage_spaces"
    return is_superuser(user) or has_general_permission(user, permission)


def can_manage_units_spaces(user: User, unit: Unit):
    permission = "can_manage_spaces"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, unit.service_sectors.all(), permission)
        or has_unit_permission(user, [unit], permission)
    )


def can_view_users(user: User):
    permission = "can_view_users"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or has_unit_permission(user, Unit.objects.all(), permission)
        or has_service_sector_permission(user, ServiceSector.objects.all(), permission)
    )


def can_refresh_order(user: User, payment_order: Optional[PaymentOrder]) -> bool:
    if not user.is_authenticated:
        return False

    permission = "can_manage_reservations"
    return (
        is_superuser(user)
        or has_general_permission(user, permission)
        or (payment_order and user.uuid == payment_order.reservation_user_uuid)
    )


def can_create_staff_reservation(
    user: User, reservation_unit: Iterable[ReservationUnit]
):
    permission = "can_create_staff_reservations"

    units = [r.unit_id for r in reservation_unit]
    service_sectors = ServiceSector.objects.filter(units__in=units)

    return (
        is_superuser(user)
        or has_unit_permission(user, units, permission)
        or has_general_permission(user, permission)
        or has_service_sector_permission(user, service_sectors, permission)
    )
