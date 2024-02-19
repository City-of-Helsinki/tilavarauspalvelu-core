import datetime

import pytest

from applications.choices import Weekday
from tests.factories import AllocatedTimeSlotFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__allocated_time_of_week__day_of_the_week_number():
    allocation = AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(12, 0),
        end_time=datetime.time(14, 0),
    )
    assert allocation.allocated_time_of_week == "1-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 1

    allocation.day_of_the_week = Weekday.TUESDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "2-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 2

    allocation.day_of_the_week = Weekday.WEDNESDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "3-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 3

    allocation.day_of_the_week = Weekday.THURSDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "4-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 4

    allocation.day_of_the_week = Weekday.FRIDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "5-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 5

    allocation.day_of_the_week = Weekday.SATURDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "6-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 6

    allocation.day_of_the_week = Weekday.SUNDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "7-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 7
