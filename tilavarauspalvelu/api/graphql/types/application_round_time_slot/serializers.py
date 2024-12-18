from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.validators import (
    TimeSlotSerializer,
    validate_reservable_times_begin_end,
    validate_reservable_times_overlap,
)


class ApplicationRoundTimeSlotSerializer(NestingModelSerializer):
    reservable_times = TimeSlotSerializer(many=True, required=False)

    class Meta:
        model = ApplicationRoundTimeSlot
        fields = [
            "weekday",
            "closed",
            "reservable_times",
        ]
        extra_kwargs = {
            "weekday": {
                "required": True,
            },
        }

    @staticmethod
    def validate_reservable_times(timeslots: list[dict[str, Any]]) -> list[dict[str, Any]]:
        validate_reservable_times_begin_end(timeslots)
        validate_reservable_times_overlap(timeslots)
        return timeslots
