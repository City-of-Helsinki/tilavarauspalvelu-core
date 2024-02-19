from graphene_django_extensions import DjangoNode

from api.graphql.types.allocated_time_slot.filtersets import AllocatedTimeSlotFilterSet
from api.graphql.types.allocated_time_slot.permissions import AllocatedTimeSlotPermission
from applications.models import AllocatedTimeSlot

__all__ = [
    "AllocatedTimeSlotNode",
]


class AllocatedTimeSlotNode(DjangoNode):
    class Meta:
        model = AllocatedTimeSlot
        fields = [
            "pk",
            "day_of_the_week",
            "begin_time",
            "end_time",
            "reservation_unit_option",
        ]
        filterset_class = AllocatedTimeSlotFilterSet
        permission_classes = [AllocatedTimeSlotPermission]
