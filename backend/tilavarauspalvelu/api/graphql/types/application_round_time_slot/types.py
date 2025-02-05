import datetime
from typing import TypedDict

from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields.graphql import TypedDictListField

from tilavarauspalvelu.models import ApplicationRoundTimeSlot

from .permissions import ApplicationRoundTimeSlotPermission

__all__ = [
    "ApplicationRoundTimeSlotNode",
]


class TimeSlot(TypedDict):
    begin: datetime.time
    end: datetime.time


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
