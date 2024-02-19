from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from django.core.exceptions import ValidationError
from django.utils import formats
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from applications.typing import TimeSlot
from common.utils import comma_sep_str

if TYPE_CHECKING:
    from applications.models import ApplicationSection

__all__ = [
    "validate_reservable_times",
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


def validate_reservation_unit_option_preferred_ordering(
    instance: ApplicationSection | None,
    data: list[dict[str, Any]],
) -> None:
    from applications.models import ReservationUnitOption

    # Fetch current ordering for existing event reservation units
    current_ordering: dict[str, int] = {}
    if instance is not None:
        current_ordering: dict[str, int] = {
            option["pk"]: option["preferred_order"]
            for option in ReservationUnitOption.objects.filter(application_section=instance).values(
                "preferred_order", "pk"
            )
        }

    errors: list[str] = []

    # Check if there are duplicates in the new ordering.
    tracked_ordering: dict[int, list[str]] = {}
    for num, item in enumerate(data, start=1):
        # Use #1, #2, ... in error messages for new reservation units
        pk_or_order = item.get("pk", f"#{num}")

        order: int | None = item.get("preferred_order", current_ordering.get(pk_or_order))
        if order is None:
            errors.append("Field 'preferred_order' is required")
            continue

        if order in tracked_ordering:
            errors.append(
                f"Reservation Unit Option {pk_or_order} has duplicate 'preferred_order' "
                f"{order} with these Reservation Unit Options: {comma_sep_str(tracked_ordering[order])}"
            )

        tracked_ordering.setdefault(order, [])
        tracked_ordering[order].append(pk_or_order)

    # Raise errors early since the sequential check would always fail if there are duplicates
    if errors:
        raise serializers.ValidationError(errors)

    # Check preferred_order is sequential, starting from zero
    for index, (tracked, pks) in enumerate(sorted(tracked_ordering.items(), key=lambda x: x[0])):
        if index != tracked:
            # There should be only one pk in the list, since we raised errors early
            errors.append(f"Reservation Unit Option {pks[0]} has 'preferred_order' {tracked} but should be {index}")

    if errors:
        raise serializers.ValidationError(errors)
