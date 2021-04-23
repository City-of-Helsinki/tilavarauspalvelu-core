from rest_framework import permissions

from applications.models import Application, ApplicationRound
from spaces.models import ServiceSector, Unit, UnitGroup

from .helpers import (
    can_allocate_allocation_request,
    can_allocate_service_sector_allocations,
    can_manage_ability_groups,
    can_manage_age_groups,
    can_manage_districts,
    can_manage_equipment,
    can_manage_equipment_categories,
    can_manage_general_roles,
    can_manage_purposes,
    can_manage_reservation_unit_types,
    can_manage_resources,
    can_manage_service_sector_roles,
    can_manage_service_sectors_application_rounds,
    can_manage_unit_group_roles,
    can_manage_unit_roles,
    can_manage_units_reservation_units,
    can_modify_application,
    can_modify_application_round,
    can_modify_city,
    can_modify_reservation,
    can_modify_reservation_unit,
    can_view_reservation,
)


class AllowNonePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        return False

    def has_permission(self, request, view):
        return False


class ReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class ReservationUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and can_modify_reservation_unit(
            request.user, reservation_unit
        )

    def has_permission(self, request, view):
        if request.method == "POST":
            unit_id = request.data.get("unit_id")
            try:
                unit = Unit.objects.get(pk=unit_id)
            except Unit.DoesNotExist:
                return False
            return request.user.is_authenticated and can_manage_units_reservation_units(
                request.user, unit
            )

        return True


class ResourcePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_resources(request.user)


class ReservationPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation):
        if request.method in permissions.SAFE_METHODS:
            return can_view_reservation(request.user, reservation)
        return can_modify_reservation(request.user, reservation)

    def has_permission(self, request, view):
        return request.user.is_authenticated


class GeneralRolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return can_manage_general_roles(request.user)


class UnitRolePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, unit_role):
        if unit_role.unit_group:
            return can_manage_unit_group_roles(request.user, unit_role.unit_group)
        if unit_role.unit:
            return can_manage_unit_roles(request.user, unit_role.unit)
        return False

    def has_permission(self, request, view):
        if request.method == "POST":
            unit_id = request.data.get("unit_id", None)
            unit_group_id = request.data.get("unit_group_id", None)
            if unit_id:
                unit = Unit.objects.get(pk=unit_id)
                return can_manage_unit_roles(request.user, unit)
            elif unit_group_id:
                unit_group = UnitGroup.objects.get(pk=unit_group_id)
                return can_manage_unit_group_roles(request.user, unit_group)
        return request.method in permissions.SAFE_METHODS


class ServiceSectorRolePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, service_sector_role):
        if request.method in permissions.SAFE_METHODS:
            return True
        return can_manage_service_sector_roles(
            request.user, service_sector_role.service_sector
        )

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        service_sector_id = request.data.get("service_sector_id")
        try:
            service_sector = ServiceSector.objects.get(pk=service_sector_id)
            return can_manage_service_sector_roles(request.user, service_sector)
        except ServiceSector.DoesNotExist:
            return False


class ApplicationRoundPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, application_round):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_modify_application_round(request.user, application_round)

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        service_sector_id = request.data.get("service_sector_id")
        try:
            service_sector = ServiceSector.objects.get(pk=service_sector_id)
            return can_manage_service_sectors_application_rounds(
                request.user, service_sector
            )
        except ServiceSector.DoesNotExist:
            return False


class CityPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, city):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_modify_city(request.user)

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_modify_city(request.user)


class ApplicationPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, application):
        return can_modify_application(request.user, application)

    def has_permission(self, request, view):
        return request.user.is_authenticated


class AllocationRequestPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, allocation_request):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_allocate_allocation_request(request.user, allocation_request)

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        application_round_id = request.data.get("application_round_id")
        try:
            application_round = ApplicationRound.objects.get(pk=application_round_id)
            service_sector = application_round.service_sector
            return can_allocate_service_sector_allocations(request.user, service_sector)
        except (ServiceSector.DoesNotExist, ApplicationRound.DoesNotExist):
            return False


class AllocationResultsPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return False

    def has_permission(self, request, view):
        service_sector_id = request.data.get(
            "service_sector_id"
        ) or request.query_params.get("service_sector_id")
        service_sector = ServiceSector.objects.filter(id=service_sector_id).first()
        if not service_sector:
            return False

        if (
            request.method in permissions.SAFE_METHODS
            and can_allocate_service_sector_allocations(request.user, service_sector)
        ):
            return True
        return False


class ApplicationEventPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, application_event):
        return can_modify_application(request.user, application_event.application)

    def has_permission(self, request, view):
        if request.method == "POST":
            application_id = request.data.get("application_id")
            try:
                application = Application.objects.get(pk=application_id)
                return can_modify_application(request.user, application)
            except Application.DoesNotExist:
                return False
        return request.user.is_authenticated


class AgeGroupPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_age_groups(request.user)


class PurposePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_purposes(request.user)


class AbilityGroupPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_ability_groups(request.user)


class ReservationUnitTypePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_reservation_unit_types(request.user)


class EquipmentCategoryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_equipment_categories(request.user)


class EquipmentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_equipment(request.user)


class DistrictPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return can_manage_districts(request.user)


class UserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and request.method in permissions.SAFE_METHODS
        )
