from typing import Any

from rest_framework import serializers

from applications.models import ApplicationRoundTimeSlot
from applications.validators import (
    TimeSlotSerializer,
    validate_reservable_times_begin_end,
    validate_reservable_times_overlap,
)


class ApplicationRoundTimeSlotSerializer(serializers.ModelSerializer):
    reservable_times = TimeSlotSerializer(many=True, required=False)

    class Meta:
        model = ApplicationRoundTimeSlot
        fields = [
            "weekday",
            "closed",
            "reservable_times",
        ]

    @staticmethod
    def validate_reservable_times(timeslots: list[dict[str, Any]]) -> list[dict[str, Any]]:
        validate_reservable_times_begin_end(timeslots)
        validate_reservable_times_overlap(timeslots)
        return timeslots
