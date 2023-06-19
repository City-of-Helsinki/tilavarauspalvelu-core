from rest_framework import permissions

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventScheduleResult,
    ApplicationEventStatus,
    ApplicationEventWeeklyAmountReduction,
    ApplicationRound,
)
from permissions.helpers import (
    can_allocate_service_sector_allocations,
    can_manage_ability_groups,
    can_manage_age_groups,
    can_manage_equipment,
    can_manage_equipment_categories,
    can_manage_general_roles,
    can_manage_purposes,
    can_manage_reservation_unit_types,
    can_manage_resources,
    can_manage_service_sector_roles,
    can_manage_service_sectors_application_rounds,
    can_manage_service_sectors_applications,
    can_manage_unit_group_roles,
    can_manage_unit_roles,
    can_manage_units_reservation_units,
    can_modify_application,
    can_modify_application_round,
    can_modify_city,
    can_modify_recurring_reservation,
    can_modify_reservation,
    can_modify_reservation_unit,
    can_read_application,
    can_view_recurring_reservation,
    can_view_reservation,
)
from spaces.models import ServiceSector, Unit, UnitGroup


class AllowNonePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        return False

    def has_permission(self, request, view):
        return False


class ReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class ReservationUnitCalendarUrlPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        return request.user.is_authenticated and can_modify_reservation_unit(
            request.user, reservation_unit
        )

    def has_permission(self, request, view):
        return True


class ReservationUnitPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        if view.action == "capacity":
            if request.user.is_authenticated:
                return True
            return False

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
            return request.user.is_authenticated and can_manage_units_reservation_units(
                request.user, unit
            )

        if view.action == "capacity":
            if request.user.is_authenticated:
                return True
            return False

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


class RecurringReservationPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, recurring_reservation):
        if request.method in permissions.SAFE_METHODS:
            return can_view_recurring_reservation(request.user, recurring_reservation)
        return can_modify_recurring_reservation(request.user, recurring_reservation)

    def has_permission(self, request, view):
        return request.user.is_authenticated


class GeneralRolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return can_manage_general_roles(request.user)


class UnitRolePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, unit_role):
        if unit_role.unit_group:
            return can_manage_unit_group_roles(request.user, [unit_role.unit_group.id])
        if unit_role.unit:
            return can_manage_unit_roles(request.user, [unit_role.unit.id])
        return False

    def has_permission(self, request, view):
        if request.method == "POST":
            unit_ids = request.data.get("unit_id", None)
            unit_group_ids = request.data.get("unit_group_id", None)
            if unit_ids:
                units = Unit.objects.filter(pk__in=unit_ids)
                return can_manage_unit_roles(request.user, units)
            elif unit_group_ids:
                unit_groups = UnitGroup.objects.filter(pk__in=unit_group_ids)
                return can_manage_unit_group_roles(request.user, unit_groups)
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

        service_sector_id = request.data.get("service_sector_id", None)
        if not service_sector_id and view.detail:
            return request.user.is_authenticated
        try:
            service_sector = ServiceSector.objects.get(pk=service_sector_id)
            return can_manage_service_sectors_application_rounds(
                request.user, service_sector
            )
        except ServiceSector.DoesNotExist:
            return False


class ApplicationStatusPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, application_event_status):
        return False

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if isinstance(request.data, list):
            for data in request.data:
                application_id = data.get("application_id")
                permission_granted = self.check_permissions_for_single(
                    request, application_id
                )

                if not permission_granted:
                    return False
            return True

        application_id = request.data.get("application_id")

        return self.check_permissions_for_single(request, application_id)

    def check_permissions_for_single(self, request, application_id):
        try:
            service_sector = ServiceSector.objects.get(
                applicationround=ApplicationRound.objects.filter(
                    applications=application_id
                )[:1]
            )
            return can_manage_service_sectors_applications(request.user, service_sector)
        except ServiceSector.DoesNotExist:
            return False


class ApplicationEventStatusPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, application_event_status):
        return False

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if isinstance(request.data, list):
            for data in request.data:
                application_event_id = data.get("application_event_id")
                status = data.get("status")
                permission_granted = self.check_permissions_for_single(
                    request, status, application_event_id
                )
                if not permission_granted:
                    return False
            return True

        application_event_id = request.data.get("application_event_id")
        status = request.data.get("status")
        return self.check_permissions_for_single(request, status, application_event_id)

    def check_permissions_for_single(self, request, status, application_event_id):
        if not application_event_id:
            return False
        try:
            service_sector = ServiceSector.objects.filter(
                applicationround=ApplicationRound.objects.filter(
                    applications=Application.objects.filter(
                        application_events=application_event_id
                    )[:1]
                )[:1]
            )

            if status in (
                ApplicationEventStatus.APPROVED,
                ApplicationEventStatus.DECLINED,
            ):
                return can_manage_service_sectors_applications(
                    request.user, service_sector.first()
                )
        except (
            Application.DoesNotExist,
            ApplicationEvent.DoesNotExist,
            ApplicationRound.DoesNotExist,
            ServiceSector.DoesNotExist,
        ):
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
        if request.method in permissions.SAFE_METHODS:
            return can_read_application(request.user, application)
        return can_modify_application(request.user, application)

    def has_permission(self, request, view):
        return request.user.is_authenticated


class AllocationResultsPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: ApplicationEventScheduleResult):
        service_sector = (
            obj.application_event_schedule.application_event.application.application_round.service_sector
        )

        if (
            request.method != "post"
            and request.user.is_authenticated
            and can_allocate_service_sector_allocations(request.user, service_sector)
        ):
            return True
        return False

    def has_permission(self, request, view):
        service_sector_id = request.data.get(
            "service_sector_id"
        ) or request.query_params.get("service_sector_id")
        service_sector = ServiceSector.objects.filter(id=service_sector_id).first()

        if (
            request.method != "post"
            and request.user.is_authenticated
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


class ApplicationEventWeeklyAmountReductionPermission(permissions.BasePermission):
    def has_object_permission(
        self, request, view, weekly_reduction: ApplicationEventWeeklyAmountReduction
    ):
        service_sector = (
            weekly_reduction.application_event.application.application_round.service_sector
        )
        if (
            (
                request.method in permissions.SAFE_METHODS
                or request.method in ["POST", "DELETE"]
            )
            and request.user
            and request.user.is_authenticated
            and can_manage_service_sectors_applications(request.user, service_sector)
        ):
            return True
        return False

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        result_id = request.data.get("application_event_schedule_result_id")
        if result_id is not None:
            try:
                schedule_result = ApplicationEventScheduleResult.objects.get(
                    pk=result_id
                )
                service_sector = ServiceSector.objects.filter(
                    applicationround=ApplicationRound.objects.get(
                        applications=Application.objects.get(
                            application_events=schedule_result.application_event_schedule.application_event.id
                        )
                    )
                ).first()

                return can_manage_service_sectors_applications(
                    request.user, service_sector
                )
            except (ApplicationEventScheduleResult.DoesNotExist,):
                return False
        return True


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


class UserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and request.method in permissions.SAFE_METHODS
        )


class WebhookPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        return True

    def has_permission(self, request, view):
        if request.method == "POST":
            return True

        return False
