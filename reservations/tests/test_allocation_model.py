import datetime

import pytest

from reservations.allocation_models import ALLOCATION_PRECISION, AllocationData
from reservations.tests.conftest import get_default_end, get_default_start


@pytest.mark.django_db
def test_should_map_application_period_dates(minimal_application):
    data = AllocationData(application=minimal_application)

    assert data.period_start == get_default_start()
    assert data.period_end == get_default_end()


@pytest.mark.django_db
def test_should_map_reservation_unit_open_times(application_with_reservation_units):

    data = AllocationData(application=application_with_reservation_units)

    times = [
        [available.start, available.end] for available in data.spaces[0].available_times
    ]

    # Open every day in application period from 10.00 to 22.00
    expected = [
        [
            round((i * 24 + 10) * 60 // ALLOCATION_PRECISION),
            round((i * 24 + 22) * 60 // ALLOCATION_PRECISION),
        ]
        for i in range(31)
    ]
    assert times == expected


@pytest.mark.django_db
def test_should_map_application_events(
    minimal_application, recurring_application_event, scheduled_for_monday
):

    data = AllocationData(application=minimal_application)

    dates = []
    start = datetime.datetime(2020, 1, 6, 10, 0)
    delta = datetime.timedelta(days=7)
    while start <= datetime.datetime(2020, 2, 24, 10, 0):
        dates.append(start)
        start += delta

    assert data.allocation_events[0].occurrences == dates
    assert data.allocation_events[0].id == recurring_application_event.id
