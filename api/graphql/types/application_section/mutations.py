from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation
from rest_framework.exceptions import ValidationError

from api.graphql.types.application_section.permissions import ApplicationSectionPermission
from api.graphql.types.application_section.serializers import ApplicationSectionSerializer
from api.graphql.types.application_section.types import ApplicationSectionNode
from applications.models import ApplicationSection
from common.typing import AnyUser

__all__ = [
    "ApplicationSectionCreateMutation",
    "ApplicationSectionUpdateMutation",
    "ApplicationSectionDeleteMutation",
]


class ApplicationSectionCreateMutation(CreateMutation):
    class Meta:
        node = ApplicationSectionNode
        serializer_class = ApplicationSectionSerializer
        permission_classes = [ApplicationSectionPermission]


class ApplicationSectionUpdateMutation(UpdateMutation):
    class Meta:
        node = ApplicationSectionNode
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
