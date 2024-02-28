from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from django.core.exceptions import ValidationError
from django.utils import formats
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from applications.typing import TimeSlot

if TYPE_CHECKING:
    pass

__all__ = [
    "validate_reservable_times",
    "validate_reservable_times_begin_end",
    "validate_reservable_times_overlap",
    "validate_string_time",
]


class TimeSlotSerializer(serializers.Serializer):
    begin = serializers.TimeField()
    end = serializers.TimeField()


def validate_reservable_times(input_data: list[dict[str, Any]]) -> None:
    serializer = TimeSlotSerializer(data=input_data, many=True)
    if not serializer.is_valid():
        raise ValidationError(serializer._errors)

    errors: list[str] = []
    timeslots: list[TimeSlot] = serializer.validated_data

    try:
        validate_reservable_times_begin_end(timeslots)
    except ValidationError as error:
        errors.append(error.error_list)

    if errors:
        raise ValidationError(errors)

    try:
        validate_reservable_times_overlap(timeslots)
    except ValidationError as error:
        errors.append(error.error_list)

    if errors:
        raise ValidationError(errors)


def validate_reservable_times_begin_end(timeslots: list[TimeSlot]) -> None:
    errors: list[str] = []

    for i, timeslot in enumerate(timeslots, start=1):
        # If end time is at midnight, it's handled as if it's on the next day
        if timeslot["begin"] >= timeslot["end"] != datetime.time(hour=0, minute=0):
            errors.append(f"Timeslot {i} begin time must be before end time.")

        if timeslot["begin"].minute % 30 != 0 or timeslot["end"].minute % 30 != 0:
            errors.append(f"Timeslot {i} begin and end time must be at 30 minute intervals.")

    if errors:
        raise ValidationError(errors)


def validate_reservable_times_overlap(timeslots: list[TimeSlot]) -> None:
    errors: dict[tuple[int, int], str] = {}

    for i, timeslot in enumerate(timeslots, start=1):
        begin = timeslot["begin"]
        end = timeslot["end"]
        for j, other_timeslot in enumerate(timeslots, start=1):
            if i == j:
                continue

            other_begin = other_timeslot["begin"]
            other_end = other_timeslot["end"]

            if (begin == other_begin and end == other_end) or (begin < other_end <= end or end > other_begin >= begin):
                msg = (
                    f"Timeslot {i} ({begin.isoformat()} - {end.isoformat()}) overlaps with "
                    f"timeslot {j} ({other_begin.isoformat()} - {other_end.isoformat()})."
                )
                key: tuple[int, int] = tuple(sorted([i, j]))  # type: ignore[assignment]
                errors.setdefault(key, msg)

    if errors:
        raise ValidationError(list(errors.values()))


INPUT_FORMATS = formats.get_format_lazy("TIME_INPUT_FORMATS")


def validate_string_time(value: str) -> datetime.time:
    if not value:
        raise ValidationError(_("This field is required."), code="required")

    for input_format in INPUT_FORMATS:
        try:
            return datetime.datetime.strptime(value, input_format).time()
        except (ValueError, TypeError):
            continue

    raise ValidationError(_("Enter a valid time."), code="invalid")
