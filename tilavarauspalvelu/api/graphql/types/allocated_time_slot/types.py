from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import AllocatedTimeSlot

from .filtersets import AllocatedTimeSlotFilterSet
from .permissions import AllocatedTimeSlotPermission

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
