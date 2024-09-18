from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields.graphql import TypedDictListField

from applications.models.application_round_time_slot import ApplicationRoundTimeSlot
from applications.typing import TimeSlot

from .permissions import ApplicationRoundTimeSlotPermission

__all__ = [
    "ApplicationRoundTimeSlotNode",
]


class ApplicationRoundTimeSlotNode(DjangoNode):
    reservable_times = TypedDictListField(TimeSlot)

    class Meta:
        model = ApplicationRoundTimeSlot
        fields = [
            "pk",
            "weekday",
            "closed",
            "reservable_times",
        ]
        permission_classes = [ApplicationRoundTimeSlotPermission]
