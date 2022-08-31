from typing import Any

from django.shortcuts import get_object_or_404
from graphene import ResolveInfo
from graphene_permissions.permissions import BasePermission

from applications.models import Application, ApplicationEvent, ApplicationEventSchedule
from permissions.helpers import (
    can_create_reservation,
    can_handle_application,
    can_handle_reservation,
    can_manage_ability_groups,
    can_manage_age_groups,
    can_manage_equipment,
    can_manage_equipment_categories,
    can_manage_purposes,
    can_manage_qualifiers,
    can_manage_reservation_purposes,
    can_manage_resources,
    can_manage_service_sectors_applications,
    can_manage_spaces,
    can_manage_units,
    can_manage_units_reservation_units,
    can_manage_units_spaces,
    can_modify_application,
    can_modify_reservation,
    can_read_application,
    can_view_recurring_reservation,
)
from reservation_units.models import ReservationUnit, ReservationUnitImage
from reservations.models import RecurringReservation, Reservation
from spaces.models import Unit


class ApplicationRoundPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ApplicationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        user = info.context.user
        application = Application.objects.filter(id=id)

        if application:
            return user.is_authenticated and can_read_application(user, application)

        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")

        if pk:
            application = Application.objects.filter(id=pk).first()
            if not application:
                return False
            return can_modify_application(info.context.user, application)

        return cls.has_permission(info)

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return info.context.user.is_authenticated


class ApplicationEventPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        application_pk = input.get("application")
        application = None
        if pk:
            try:
                application_event = ApplicationEvent.objects.get(id=pk)
            except ApplicationEvent.DoesNotExist:
                return False
            application = application_event.application
        elif application_pk:
            try:
                application = Application.objects.get(id=application_pk)
            except Application.DoesNotExist:
                return False

        if not application:
            return False

        return can_modify_application(info.context.user, application)

    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return info.context.user.is_authenticated


class ApplicationEventSetFlagPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        try:
            event = ApplicationEvent.objects.get(id=input["pk"])
        except (ApplicationEvent.DoesNotExist, KeyError):
            return False

        return can_handle_application(info.context.user, event.application)


class ApplicationSetFlagPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        try:
            application = Application.objects.get(id=input["pk"])
        except (Application.DoesNotExist, KeyError):
            return False

        return can_handle_application(info.context.user, application)


class ApplicationEventDeclinePermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        if not pk:
            return False
        event = ApplicationEvent.objects.filter(id=pk).first()
        if not event:
            return False

        return can_manage_service_sectors_applications(
            info.context.user, event.application.application_round.service_sector
        )

    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return False


class ApplicationDeclinePermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        if not pk:
            return False
        application = Application.objects.filter(id=pk).first()
        if not application:
            return False

        return can_manage_service_sectors_applications(
            info.context.user, application.application_round.service_sector
        )

    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return False


class ApplicationEventScheduleResultPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        if not cls.has_permission(info):
            return False

        pk = input.get("application_event_schedule")
        if not pk:
            return False

        schedule = ApplicationEventSchedule.objects.get(pk=pk)
        application = schedule.application_event.application
        service_sector = application.application_round.service_sector

        return can_manage_service_sectors_applications(
            info.context.user, service_sector
        )

    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        user = info.context.user

        if user.is_anonymous:
            return False

        service_sector_roles = user.service_sector_roles.all()
        unit_roles = user.unit_roles.all()
        general_roles = user.general_roles.all()

        # User need to have some roles to have any access to results.
        if (
            service_sector_roles.exists()
            or unit_roles.exists()
            or general_roles.exists()
        ):
            return True

        return False


class OrganisationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        user = info.context.user
        return user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class AddressPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ReservationUnitHaukiUrlPermission(BasePermission):
    """Check permissions in resolver level. Cannot figure out the permissions without knowing unit."""

    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return False

    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ReservationUnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        unit_pk = input.get("unit_pk")
        pk = input.get("pk")
        if not unit_pk:
            unit_pk = getattr(
                ReservationUnit.objects.filter(pk=pk).first(), "unit_id", None
            )
        if not unit_pk:
            return False
        unit = Unit.objects.filter(id=unit_pk).first()
        return can_manage_units_reservation_units(info.context.user, unit)


class ReservationUnitImagePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        if input.get("pk"):
            reservation_unit_pk = (
                ReservationUnitImage.objects.filter(id=input.get("pk"))
                .values_list("reservation_unit_id", flat=True)
                .first()
            )
        else:
            reservation_unit_pk = input.get("reservation_unit_pk")
        if not reservation_unit_pk:
            return False

        unit = Unit.objects.filter(reservationunit=reservation_unit_pk).first()
        if not unit:
            return False
        return can_manage_units_reservation_units(info.context.user, unit)


class ResourcePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_resources(info.context.user)


class ReservationPurposePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_reservation_purposes(info.context.user)


class ReservationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        """Authenticated users can see reservations.

        The reservation fields has own permission checks.
        """
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=input.get("pk"))
            return can_modify_reservation(info.context.user, reservation)
        return can_create_reservation(info.context.user)

    @classmethod
    def has_filter_permission(self, info: ResolveInfo) -> bool:
        """Authenticated users can see reservations.

        The reservation fields has own permission checks.
        """
        return info.context.user.is_authenticated


class ReservationHandlingPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            return can_handle_reservation(info.context.user, reservation)
        return False


class RecurringReservationPermission(BasePermission):
    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        recurring_reservation = RecurringReservation.objects.filter(id=id)
        if not recurring_reservation:
            return False
        return can_view_recurring_reservation(info.context.user, recurring_reservation)

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class PurposePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_purposes(info.context.user)


class QualifierPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_qualifiers(info.context.user)


class AgeGroupPermission(BasePermission):
    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_age_groups(info.context.user)


class AbilityGroupPermission(BasePermission):
    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_ability_groups(info.context.user)


class SpacePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        unit_id = input.get("unit_pk")
        if unit_id:
            try:
                unit = Unit.objects.get(id=unit_id)
            except Unit.DoesNotExist:
                pass
            else:
                return can_manage_units_spaces(info.context.user, unit)
        return can_manage_spaces(info.context.user)


class ServicePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class UnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        unit = get_object_or_404(Unit, pk=pk)
        return can_manage_units(info.context.user, unit)


class KeywordPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class EquipmentCategoryPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_equipment_categories(info.context.user)


class EquipmentPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_equipment(info.context.user)


class ReservationUnitCancellationRulePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class TermsOfUsePermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class TaxPercentagePermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class CityPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ReservationMetadataSetPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ServiceSectorPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class UserPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        user = info.context.user
        if user.is_anonymous:
            return False

        if "pk" not in input:
            return False

        if user.pk != input["pk"]:
            return False

        service_sector_roles = user.service_sector_roles.all()
        unit_roles = user.unit_roles.all()
        general_roles = user.general_roles.all()

        if (
            user.is_superuser
            or service_sector_roles.exists()
            or unit_roles.exists()
            or general_roles.exists()
        ):
            return True

        return False


class GeneralRolePermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ServiceSectorRolePermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class UnitRolePermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False
