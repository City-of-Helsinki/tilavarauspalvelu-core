from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.models import ApplicationSection

from .permissions import (
    ApplicationSectionPermission,
    ApplicationSectionReservationCancellationPermission,
    UpdateAllSectionOptionsPermission,
)
from .serializers import (
    ApplicationSectionReservationCancellationInputSerializer,
    ApplicationSectionReservationCancellationOutputSerializer,
    ApplicationSectionSerializer,
    RejectAllSectionOptionsSerializer,
    RestoreAllSectionOptionsSerializer,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser

    from .serializers import CancellationOutput

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
            msg = "Application section has been allocated and cannot be deleted anymore."
            raise ValidationError(msg)


class RejectAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RejectAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]


class RestoreAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RestoreAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]


class ApplicationSectionReservationCancellationMutation(UpdateMutation):
    class Meta:
        serializer_class = ApplicationSectionReservationCancellationInputSerializer
        output_serializer_class = ApplicationSectionReservationCancellationOutputSerializer
        permission_classes = [ApplicationSectionReservationCancellationPermission]

    @classmethod
    def get_serializer_output(cls, instance: CancellationOutput) -> dict[str, Any]:
        # `instance` take from serializer.save() return value, so overriding it "works"
        return {
            "future": instance["expected_cancellations"],
            "cancelled": instance["actual_cancellations"],
        }
