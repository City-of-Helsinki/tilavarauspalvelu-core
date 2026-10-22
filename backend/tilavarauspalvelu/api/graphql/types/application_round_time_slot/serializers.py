from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.validators import (
    TimeSlotSerializer,
    validate_reservable_times_begin_end,
    validate_reservable_times_overlap,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import TimeSlot


class ApplicationRoundTimeSlotSerializer(NestingModelSerializer[ApplicationRoundTimeSlot]):
    reservable_times = TimeSlotSerializer(many=True, required=False)

    class Meta:
        model = ApplicationRoundTimeSlot
        fields = [
            "weekday",
            "is_closed",
            "reservable_times",
        ]
        extra_kwargs = {
            "weekday": {
                "required": True,
            },
        }

    @staticmethod
    def validate_reservable_times(timeslots: list[TimeSlot]) -> list[TimeSlot]:
        validate_reservable_times_begin_end(timeslots)
        validate_reservable_times_overlap(timeslots)
        return timeslots
