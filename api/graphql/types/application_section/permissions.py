from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from api.graphql.extensions import error_codes
from applications.models import Application, ApplicationSection
from common.typing import AnyUser
from permissions.helpers import can_modify_application

__all__ = [
    "ApplicationSectionPermission",
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
