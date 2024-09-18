from graphene_django_extensions import CreateMutation, DeleteMutation
from graphene_django_extensions.typing import AnyUser
from rest_framework.exceptions import ValidationError

from applications.models import AllocatedTimeSlot

from .permissions import AllocatedTimeSlotPermission
from .serializers import AllocatedTimeSlotCreateSerializer

__all__ = [
    "AllocatedTimeSlotCreateMutation",
]


class AllocatedTimeSlotCreateMutation(CreateMutation):
    class Meta:
        serializer_class = AllocatedTimeSlotCreateSerializer
        permission_classes = [AllocatedTimeSlotPermission]


class AllocatedTimeSlotDeleteMutation(DeleteMutation):
    class Meta:
        model = AllocatedTimeSlot
        permission_classes = [AllocatedTimeSlotPermission]

    @classmethod
    def validate_deletion(cls, instance: AllocatedTimeSlot, user: AnyUser) -> None:
        application_round = instance.reservation_unit_option.application_section.application.application_round
        if not application_round.status.can_remove_allocations:
            msg = "Cannot delete allocations from an application round not in the allocation stage."
            raise ValidationError(msg)
