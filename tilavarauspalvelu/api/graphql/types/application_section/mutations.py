from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation
from rest_framework.exceptions import ValidationError

from applications.models import ApplicationSection
from common.typing import AnyUser

from .permissions import ApplicationSectionPermission, UpdateAllSectionOptionsPermission
from .serializers import (
    ApplicationSectionSerializer,
    RejectAllSectionOptionsSerializer,
    RestoreAllSectionOptionsSerializer,
)

__all__ = [
    "ApplicationSectionCreateMutation",
    "ApplicationSectionDeleteMutation",
    "ApplicationSectionUpdateMutation",
    "RejectAllSectionOptionsMutation",
    "RestoreAllSectionOptionsMutation",
]


class ApplicationSectionCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ApplicationSectionSerializer
        permission_classes = [ApplicationSectionPermission]


class ApplicationSectionUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationSectionSerializer
        permission_classes = [ApplicationSectionPermission]


class ApplicationSectionDeleteMutation(DeleteMutation):
    class Meta:
        model = ApplicationSection
        permission_classes = [ApplicationSectionPermission]

    @classmethod
    def validate_deletion(cls, instance: ApplicationSection, user: AnyUser) -> None:
        if not instance.status.can_delete:
            raise ValidationError("Application section has been allocated and cannot be deleted anymore.")


class RejectAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RejectAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]


class RestoreAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RestoreAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]
