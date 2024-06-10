from graphene_django_extensions import DjangoNode

from applications.models import AllocatedTimeSlot
from tilavarauspalvelu.api.graphql.types.allocated_time_slot.filtersets import AllocatedTimeSlotFilterSet
from tilavarauspalvelu.api.graphql.types.allocated_time_slot.permissions import AllocatedTimeSlotPermission

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
            "recurring_reservation",
        ]
        filterset_class = AllocatedTimeSlotFilterSet
        permission_classes = [AllocatedTimeSlotPermission]
