from __future__ import annotations

from collections.abc import Iterable
from typing import TYPE_CHECKING

from django.db import models

from common.date_utils import local_datetime
from common.typing import AnyUser

if TYPE_CHECKING:
    from applications.models import Application
    from merchants.models import PaymentOrder
    from reservation_units.models import ReservationUnit
    from reservations.models import RecurringReservation, Reservation
    from spaces.models import ServiceSector, Space, Unit


def has_general_permission(user: AnyUser, required_permission: str) -> bool:
    if user.is_anonymous:
        return False
    return required_permission in user.general_permissions


def has_unit_permission(user: AnyUser, required_permission: str, units: list[int]) -> bool:
    from spaces.models import UnitGroup

    if user.is_anonymous:
        return False
    for unit in units:
        if required_permission in user.unit_permissions.get(unit, []):
            return True

    unit_groups: list[int] = list(UnitGroup.objects.filter(units__in=units).distinct().values_list("pk", flat=True))
    return has_unit_group_permission(user, required_permission, unit_groups)


def has_unit_group_permission(user: AnyUser, required_permission: str, unit_groups: list[int]) -> bool:
    if user.is_anonymous:
        return False
    return any(required_permission in user.unit_group_permissions.get(unit_group, []) for unit_group in unit_groups)


def has_service_sector_permission(user: AnyUser, required_permission: str, service_sectors: list[int]) -> bool:
    if user.is_anonymous:
        return False
    return any(required_permission in user.service_sector_permissions.get(sector, []) for sector in service_sectors)


def can_manage_units(user: AnyUser, unit: Unit) -> bool:
    permission = "can_manage_units"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    if has_unit_permission(user, permission, [unit.id]):
        return True

    sectors: list[int] = list(unit.service_sectors.values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_manage_units_reservation_units(user: AnyUser, unit: Unit) -> bool:
    permission = "can_manage_reservation_units"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    if has_unit_permission(user, permission, [unit.id]):
        return True

    sectors: list[int] = list(unit.service_sectors.values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_modify_reservation_unit(user: AnyUser, reservation_unit: ReservationUnit) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return can_manage_units_reservation_units(user, reservation_unit.unit)


def can_manage_service_sectors_applications(user: AnyUser, service_sector: ServiceSector) -> bool:
    permission = "can_handle_applications"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    return has_service_sector_permission(user, permission, [service_sector.pk])


def can_validate_unit_applications(user: AnyUser, units: list[int]) -> bool:
    permission = "can_validate_applications"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    return has_unit_permission(user, permission, units)


def can_modify_application(user: AnyUser, application: Application) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if application.user == user and local_datetime() < application.application_round.application_period_end:
        return True
    return can_manage_service_sectors_applications(user, application.application_round.service_sector)


def can_read_application(user: AnyUser, application: Application) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if application.user == user:
        return True
    if can_manage_service_sectors_applications(user, application.application_round.service_sector):
        return True
    return can_validate_unit_applications(user, list(application.units.values_list("pk", flat=True)))


def can_access_application_private_fields(user: AnyUser, application: Application) -> bool:
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if can_manage_service_sectors_applications(user, application.application_round.service_sector):
        return True
    return can_validate_unit_applications(user, list(application.units.values_list("pk", flat=True)))


def can_view_reservation(user: AnyUser, reservation: Reservation, needs_staff_permissions: bool = False) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_view_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user and (user.has_staff_permissions if needs_staff_permissions else True):
        return True
    if has_general_permission(user, permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_modify_reservation(user: AnyUser, reservation: Reservation) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_manage_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user:
        return True
    if has_general_permission(user, permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_handle_reservation(user: AnyUser, reservation: Reservation) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_manage_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_comment_reservation(user: AnyUser, reservation: Reservation) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_comment_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if reservation.user == user and user.has_staff_permissions:
        return True
    if has_general_permission(user, permission):
        return True

    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    if has_service_sector_permission(user, permission, sectors):
        return True

    return can_handle_reservation(user, reservation)


def can_handle_reservation_with_units(user: AnyUser, reservation_units: list[int]) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_manage_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True

    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_view_recurring_reservation(user: AnyUser, recurring_reservation: RecurringReservation) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_view_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if recurring_reservation.user == user:
        return True

    reservation_units = recurring_reservation.reservations.values_list("reservation_unit", flat=True)
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_modify_recurring_reservation(user: AnyUser, recurring_reservation: RecurringReservation) -> bool:
    from spaces.models import ServiceSector, Unit

    permission = "can_manage_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if recurring_reservation.user == user:
        return True
    if has_general_permission(user, permission):
        return True

    reservation_unit = recurring_reservation.reservation_unit
    units: list[int] = list(Unit.objects.filter(reservationunit__in=[reservation_unit]).values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_manage_age_groups(user: AnyUser):
    permission = "can_manage_age_groups"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_purposes(user: AnyUser):
    permission = "can_manage_purposes"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_qualifiers(user: AnyUser):
    permission = "can_manage_qualifiers"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_reservation_purposes(user: AnyUser):
    permission = "can_manage_reservation_purposes"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_ability_groups(user: AnyUser):
    permission = "can_manage_ability_groups"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_equipment_categories(user: AnyUser):
    permission = "can_manage_equipment_categories"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_equipment(user: AnyUser):
    permission = "can_manage_equipment"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_resources(user: AnyUser, space: Space | None = None):
    permission = "can_manage_resources"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    if space is None:
        return False
    if has_unit_permission(user, permission, [space.unit.pk]):
        return True

    sectors: list[int] = list(space.unit.service_sectors.values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_manage_spaces(user: AnyUser):
    permission = "can_manage_spaces"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


def can_manage_units_spaces(user: AnyUser, unit: Unit):
    permission = "can_manage_spaces"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    if has_unit_permission(user, permission, [unit.pk]):
        return True

    sectors: list[int] = list(unit.service_sectors.values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_view_users(user: AnyUser):
    from spaces.models import ServiceSector, Unit

    permission = "can_view_users"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True

    units: list[int] = list(Unit.objects.all().values_list("pk", flat=True))
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.all().values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_refresh_order(user: AnyUser, payment_order: PaymentOrder | None) -> bool:
    permission = "can_manage_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True
    if payment_order is None:
        return False
    return user.uuid == payment_order.reservation_user_uuid


def can_create_staff_reservation(user: AnyUser, reservation_unit: Iterable[ReservationUnit]):
    from spaces.models import ServiceSector

    permission = "can_create_staff_reservations"

    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    if has_general_permission(user, permission):
        return True

    units: list[int] = [r.unit_id for r in reservation_unit]
    if has_unit_permission(user, permission, units):
        return True

    sectors: list[int] = list(ServiceSector.objects.filter(units__in=units).values_list("pk", flat=True))
    return has_service_sector_permission(user, permission, sectors)


def can_manage_banner_notifications(user: AnyUser) -> bool:
    permission = "can_manage_notifications"
    if user.is_anonymous:
        return False
    if user.is_superuser:
        return True
    return has_general_permission(user, permission)


# HELPERS FOR FINDING OBJECTS WHERE USER HAS PERMISSIONS


def get_service_sectors_where_can_view_applications(user: AnyUser) -> models.QuerySet:
    from spaces.models import ServiceSector

    permission = "can_handle_applications"

    if user.is_anonymous:
        return ServiceSector.objects.none().values("pk").values("pk")
    if user.is_superuser:
        return ServiceSector.objects.all().values("pk")
    if has_general_permission(user, permission):
        return ServiceSector.objects.all().values("pk")

    service_sector_ids = [pk for pk, perms in user.service_sector_permissions.items() if permission in perms]
    return ServiceSector.objects.filter(id__in=service_sector_ids).values("pk")


def get_units_where_can_view_applications(user: AnyUser) -> models.QuerySet:
    from spaces.models import Unit

    permission = "can_validate_applications"

    if user.is_anonymous:
        return Unit.objects.none().values("pk")
    if user.is_superuser:
        return Unit.objects.all().values("pk")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if permission in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if permission in perms]

    return (
        Unit.objects.filter(models.Q(id__in=unit_ids) | models.Q(unit_groups__in=unit_group_ids))
        .distinct()
        .values("id")
    )


def get_units_where_can_view_reservations(user: AnyUser) -> models.QuerySet:
    from spaces.models import Unit

    permission = "can_view_reservations"

    if user.is_anonymous:
        return Unit.objects.none().values("pk")
    if user.is_superuser:
        return Unit.objects.all().values("pk")
    if has_general_permission(user, permission):
        return Unit.objects.all().values("pk")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if permission in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if permission in perms]

    return (
        Unit.objects.filter(models.Q(id__in=unit_ids) | models.Q(unit_groups__in=unit_group_ids))
        .distinct()
        .values("id")
    )


def get_units_with_permission(user: AnyUser, permission: str) -> models.QuerySet:
    """Given a permission, returns units that match to that permission on different levels"""
    from spaces.models import Unit

    if user.is_anonymous:
        return Unit.objects.none().values("pk")
    if user.is_superuser:
        return Unit.objects.all().values("pk")
    if has_general_permission(user, permission):
        return Unit.objects.all().values("pk")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if permission in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if permission in perms]
    service_sector_ids = [pk for pk, perms in user.service_sector_permissions.items() if permission in perms]

    return (
        Unit.objects.filter(
            models.Q(id__in=unit_ids)
            | models.Q(unit_groups__in=unit_group_ids)
            | models.Q(service_sectors__in=service_sector_ids)
        )
        .distinct()
        .values("pk")
    )


def get_service_sectors_where_can_view_reservations(user: AnyUser) -> models.QuerySet:
    from spaces.models import ServiceSector

    permission = "can_view_reservations"

    if user.is_anonymous:
        return ServiceSector.objects.none().values("pk")
    if user.is_superuser:
        return ServiceSector.objects.all().values("pk")
    if has_general_permission(user, permission):
        return ServiceSector.objects.all().values("pk")

    service_sector_ids = [pk for pk, perms in user.service_sector_permissions.items() if permission in perms]
    return ServiceSector.objects.filter(id__in=service_sector_ids).values("pk")
