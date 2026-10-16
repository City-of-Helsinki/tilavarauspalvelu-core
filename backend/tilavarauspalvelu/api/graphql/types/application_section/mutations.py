from __future__ import annotations

from typing import TYPE_CHECKING, Any, Self

from django.db import transaction
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
    from tilavarauspalvelu.typing import AnyUser, GQLInfo

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
    def delete(cls, info: GQLInfo, input_data: dict[str, Any]) -> Self:
        section: ApplicationSection = cls.get_instance(input_data)
        application = section.application

        with transaction.atomic():
            output = super().delete(info, input_data)
            application.actions.reset_sent_at_if_changed_by_applicant(user=info.context.user)

        return output

    @classmethod
    def validate_deletion(cls, instance: ApplicationSection, user: AnyUser) -> None:
        if not instance.status.can_delete:
            msg = "Application section has been allocated and cannot be deleted anymore."
            raise ValidationError(msg)

        instance.application.application_round.validators.validate_open_for_applications()


class RejectAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RejectAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]


class RestoreAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RestoreAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]


class ApplicationSectionReservationCancellationMutation(UpdateMutation):
    """Cancel all reservations in the given application section that can be cancelled."""

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
