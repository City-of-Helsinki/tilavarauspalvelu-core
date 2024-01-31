import pytest

from tests.factories import ApplicationEventScheduleFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_event_schedule_factory_create_unallocated():
    schedule = ApplicationEventScheduleFactory.create()
    assert schedule.accepted is False


def test_application_event_schedule_factory_create_allocated():
    schedule = ApplicationEventScheduleFactory.create_allocated()
    assert schedule.accepted is True
