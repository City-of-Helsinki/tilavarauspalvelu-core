from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields.graphql import TypedDictListField

from api.graphql.types.application_round_time_slot.permissions import ApplicationRoundTimeSlotPermission
from applications.models.application_round_time_slot import ApplicationRoundTimeSlot
from applications.typing import TimeSlot

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
