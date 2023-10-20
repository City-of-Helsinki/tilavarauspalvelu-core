import datetime
from collections.abc import Collection
from typing import NamedTuple

import pytest
from django.core.exceptions import ValidationError

from applications.typing import TimeSlot
from applications.validators import validate_reservable_times_begin_end, validate_reservable_times_overlap
from tests.helpers import parametrize_helper


class TimeslotParams(NamedTuple):
    timeslots: list[TimeSlot]
    errors: Collection[str] = ()


class TimeslotsParams(NamedTuple):
    timeslots: list[TimeSlot]
    errors: Collection[str] = ()


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "correct": TimeslotParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=0),
                    ),
                ],
            ),
            "end_time_before_start_time": TimeslotParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=12, minute=0),
                        end=datetime.time(hour=10, minute=0),
                    ),
                ],
                errors=["Timeslot 1 begin time must be before end time."],
            ),
            "end_time_at_midnight": TimeslotParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=0, minute=0),
                    ),
                ],
            ),
            "start_and_end_time_at_30_min_interval": TimeslotParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=30),
                        end=datetime.time(hour=12, minute=30),
                    ),
                ],
            ),
            "start_time_not_at_30_min_interval": TimeslotParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=15),
                        end=datetime.time(hour=12, minute=0),
                    ),
                ],
                errors=["Timeslot 1 begin and end time must be at 30 minute intervals."],
            ),
            "end_time_not_at_30_min_interval": TimeslotParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=15),
                    ),
                ],
                errors=["Timeslot 1 begin and end time must be at 30 minute intervals."],
            ),
        },
    )
)
def test_validate_reservable_times_begin_end(timeslots, errors):
    try:
        validate_reservable_times_begin_end(timeslots)
    except ValidationError as error:
        error_messages = [item.message for item in error.error_list]
        if errors:
            assert error_messages == errors
        else:
            pytest.fail(f"Unexpected ValidationError raised: '{error_messages}'")


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "separate": TimeslotsParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=0),
                    ),
                    TimeSlot(
                        begin=datetime.time(hour=13, minute=0),
                        end=datetime.time(hour=16, minute=0),
                    ),
                ],
            ),
            "back_to_back": TimeslotsParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=0),
                    ),
                    TimeSlot(
                        begin=datetime.time(hour=12, minute=0),
                        end=datetime.time(hour=16, minute=0),
                    ),
                ],
            ),
            "overlap": TimeslotsParams(
                timeslots=[
                    TimeSlot(begin=datetime.time(hour=10, minute=0), end=datetime.time(hour=12, minute=0)),
                    TimeSlot(
                        begin=datetime.time(hour=11, minute=0),
                        end=datetime.time(hour=16, minute=0),
                    ),
                ],
                errors=["Timeslot 1 (10:00:00 - 12:00:00) overlaps with timeslot 2 (11:00:00 - 16:00:00)."],
            ),
            "one_end_time_on_midnight": TimeslotsParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=0),
                    ),
                    TimeSlot(
                        begin=datetime.time(hour=16, minute=0),
                        end=datetime.time(hour=0, minute=0),
                    ),
                ],
            ),
            "overlap_one_end_time_on_midnight": TimeslotsParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=18, minute=0),
                    ),
                    TimeSlot(
                        begin=datetime.time(hour=15, minute=0),
                        end=datetime.time(hour=0, minute=0),
                    ),
                ],
                errors=["Timeslot 1 (10:00:00 - 18:00:00) overlaps with timeslot 2 (15:00:00 - 00:00:00)."],
            ),
            "same_timeslots": TimeslotsParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=0),
                    ),
                    TimeSlot(
                        begin=datetime.time(hour=10, minute=0),
                        end=datetime.time(hour=12, minute=0),
                    ),
                ],
                errors=["Timeslot 1 (10:00:00 - 12:00:00) overlaps with timeslot 2 (10:00:00 - 12:00:00)."],
            ),
            "same_timeslots_one_on_midnight": TimeslotsParams(
                timeslots=[
                    TimeSlot(
                        begin=datetime.time(hour=15, minute=0),
                        end=datetime.time(hour=0, minute=0),
                    ),
                    TimeSlot(
                        begin=datetime.time(hour=15, minute=0),
                        end=datetime.time(hour=0, minute=0),
                    ),
                ],
                errors=["Timeslot 1 (15:00:00 - 00:00:00) overlaps with timeslot 2 (15:00:00 - 00:00:00)."],
            ),
        },
    )
)
def test_validate_reservable_times_overlap(timeslots, errors):
    try:
        validate_reservable_times_overlap(timeslots)
    except ValidationError as error:
        error_messages = [item.message for item in error.error_list]
        if errors:
            assert error_messages == errors
        else:
            pytest.fail(f"Unexpected ValidationError raised: {error_messages}")
    else:
        if errors:
            pytest.fail("ValidationError not raised.")
