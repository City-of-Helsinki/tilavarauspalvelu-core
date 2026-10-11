from __future__ import annotations

import datetime

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import SuitableTimeRange

from tests.factories import AllocatedTimeSlotFactory, ApplicationSectionFactory, SuitableTimeRangeFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_suitable_time_range__fulfilled():
    application_section = ApplicationSectionFactory.create_in_status_unallocated(
        applied_reservations_per_week=2,
    )
    time_range = SuitableTimeRangeFactory.create(
        application_section=application_section,
        day_of_the_week=Weekday.MONDAY,
    )

    # Section is in allocation, and has no allocations -> time range is not fulfilled
    assert time_range.fulfilled is False
    assert SuitableTimeRange.objects.filter(L(fulfilled=False)).exists()

    # Section is in handled -> time range is fulfilled
    time_range.application_section = ApplicationSectionFactory.create_in_status_handled()
    time_range.save()
    assert time_range.fulfilled is True
    assert SuitableTimeRange.objects.filter(L(fulfilled=True)).exists()

    # Section is in allocation, but has no allocations -> time range is not fulfilled
    time_range.application_section = ApplicationSectionFactory.create_in_status_in_allocation(
        applied_reservations_per_week=2,
    )
    time_range.save()
    assert time_range.fulfilled is False
    assert SuitableTimeRange.objects.filter(L(fulfilled=False)).exists()

    # Section has allocations, but not for the same day of the week as the range -> time range is not fulfilled
    option = time_range.application_section.reservation_unit_options.first()
    AllocatedTimeSlotFactory.create(day_of_the_week=Weekday.TUESDAY, reservation_unit_option=option)
    assert time_range.fulfilled is False
    assert SuitableTimeRange.objects.filter(L(fulfilled=False)).exists()

    # Section has allocations for the same day of the week as the range -> time range is fulfilled
    AllocatedTimeSlotFactory.create(day_of_the_week=time_range.day_of_the_week, reservation_unit_option=option)
    assert time_range.fulfilled is True
    assert SuitableTimeRange.objects.filter(L(fulfilled=True)).exists()


@pytest.mark.parametrize(
    ("range_begin", "range_end", "allocation_begin", "allocation_end", "expected"),
    [
        pytest.param(17, 20, 8, 10, False, id="allocation before range"),
        pytest.param(17, 20, 15, 17, False, id="allocation ends when range begins"),
        pytest.param(17, 20, 20, 22, False, id="allocation begins when range ends"),
        pytest.param(17, 20, 22, 0, False, id="allocation after range ends at midnight"),
        pytest.param(17, 20, 16, 18, True, id="allocation overlaps range begin"),
        pytest.param(17, 20, 19, 21, True, id="allocation overlaps range end"),
        pytest.param(17, 20, 18, 19, True, id="allocation inside range"),
        pytest.param(17, 20, 16, 21, True, id="allocation contains range"),
        pytest.param(20, 0, 18, 20, False, id="allocation ends when range ending at midnight begins"),
        pytest.param(20, 0, 19, 21, True, id="allocation overlaps begin of range ending at midnight"),
        pytest.param(20, 0, 22, 23, True, id="allocation inside range ending at midnight"),
        pytest.param(20, 0, 23, 0, True, id="allocation and range both end at midnight"),
    ],
)
def test_suitable_time_range__fulfilled__only_by_allocation_overlapping_the_range(
    range_begin,
    range_end,
    allocation_begin,
    allocation_end,
    expected,
):
    application_section = ApplicationSectionFactory.create_in_status_in_allocation(
        applied_reservations_per_week=2,
    )
    time_range = SuitableTimeRangeFactory.create(
        application_section=application_section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(range_begin),
        end_time=datetime.time(range_end),
    )
    option = application_section.reservation_unit_options.first()
    AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(allocation_begin),
        end_time=datetime.time(allocation_end),
        reservation_unit_option=option,
    )

    assert time_range.fulfilled is expected
    assert SuitableTimeRange.objects.filter(L(fulfilled=expected), pk=time_range.pk).exists()


def test_suitable_time_range__fulfilled__morning_allocation_does_not_fulfill_evening_range():
    application_section = ApplicationSectionFactory.create_in_status_in_allocation(
        applied_reservations_per_week=2,
    )
    morning_range = SuitableTimeRangeFactory.create(
        application_section=application_section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(7),
        end_time=datetime.time(10),
    )
    evening_range = SuitableTimeRangeFactory.create(
        application_section=application_section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(17),
        end_time=datetime.time(20),
    )
    option = application_section.reservation_unit_options.first()
    AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(8),
        end_time=datetime.time(9),
        reservation_unit_option=option,
    )

    assert morning_range.fulfilled is True
    assert evening_range.fulfilled is False

    unfulfilled_ranges = list(SuitableTimeRange.objects.filter(L(fulfilled=False)))
    assert unfulfilled_ranges == [evening_range]
