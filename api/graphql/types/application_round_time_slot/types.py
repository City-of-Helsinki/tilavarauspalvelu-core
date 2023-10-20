import graphene

from api.graphql.extensions.base_types import DjangoAuthNode, convert_typed_dict_to_graphene_type
from applications.models.application_round_time_slot import ApplicationRoundTimeSlot
from applications.typing import TimeSlot

from .permissions import ApplicationRoundTimeSlotPermission

__all__ = [
    "ApplicationRoundTimeSlotNode",
]


class ApplicationRoundTimeSlotNode(DjangoAuthNode):
    reservable_times = graphene.List(convert_typed_dict_to_graphene_type(TimeSlot))

    class Meta:
        model = ApplicationRoundTimeSlot
        fields = [
            "pk",
            "weekday",
            "closed",
            "reservable_times",
        ]
        permission_classes = (ApplicationRoundTimeSlotPermission,)
