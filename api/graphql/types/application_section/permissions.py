from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from api.graphql.extensions import error_codes
from applications.models import Application, ApplicationSection
from common.typing import AnyUser
from permissions.helpers import can_modify_application, has_general_permission, has_unit_permission
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices

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
        application_pk: int | None = input_data.get("application")
        if application_pk is None:
            msg = "Application is required for creating an Application Section."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        application: Application | None = Application.objects.filter(pk=application_pk).first()
        if application is None:
            msg = f"Application with pk {application_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return can_modify_application(user, application)

    @classmethod
    def has_update_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_modify_application(user, instance.application)

    @classmethod
    def has_delete_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_modify_application(user, instance.application)


class UpdateAllSectionOptionsPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True

        if has_general_permission(user, GeneralPermissionChoices.CAN_HANDLE_APPLICATIONS):
            return True

        units = instance.reservation_unit_options.all().values_list("reservation_unit__unit__id", flat=True).distinct()
        return all(has_unit_permission(user, UnitPermissionChoices.CAN_HANDLE_APPLICATIONS, [unit]) for unit in units)
