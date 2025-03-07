from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import Application

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ApplicationSectionPermission",
    "UpdateAllSectionOptionsPermission",
]


class ApplicationSectionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        application = cls._get_application(input_data)
        return user.permissions.can_manage_application(application)

    @classmethod
    def has_update_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application(instance.application)

    @classmethod
    def has_delete_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application(instance.application)

    @classmethod
    def _get_application(cls, input_data: dict[str, Any]) -> Application:
        application_pk = input_data.get("application")
        if application_pk is None:
            msg = "Application is required for creating an Application Section."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        application = Application.objects.filter(pk=application_pk).first()
        if application is None:
            msg = f"Application with pk {application_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return application


class UpdateAllSectionOptionsPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False

        from tilavarauspalvelu.models import Unit

        units = (
            Unit.objects.filter(reservation_units__reservation_unit_options__application_section=instance)
            .prefetch_related("unit_groups")
            .distinct()
        )
        return user.permissions.can_manage_applications_for_units(units)


class ApplicationSectionReservationCancellationPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user == instance.application.user
