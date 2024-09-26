import pytest
from lookup_property import L

from tests.factories import AllocatedTimeSlotFactory, ApplicationSectionFactory, SuitableTimeRangeFactory
from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import SuitableTimeRange

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
