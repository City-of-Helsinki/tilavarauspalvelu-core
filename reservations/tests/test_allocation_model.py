import datetime

import pytest

from reservations.allocation_models import ALLOCATION_PRECISION, AllocationData
from reservations.allocation_solver import AllocationSolver
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
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    data = AllocationData(application=application_with_reservation_units)

    dates = []
    start = datetime.datetime(2020, 1, 6, 10, 0)
    delta = datetime.timedelta(days=7)
    while start <= datetime.datetime(2020, 2, 24, 10, 0):
        dates.append(start)
        start += delta

    assert (
        data.allocation_events[0].occurrences[scheduled_for_monday.id].occurrences
        == dates
    )
    assert data.allocation_events[0].occurrences[scheduled_for_monday.id].weekday == 0
    assert data.allocation_events[0].id == recurring_application_event.id

    hour = 60 // ALLOCATION_PRECISION
    assert data.allocation_events[0].min_duration == hour
    assert data.allocation_events[0].max_duration == hour * 2


@pytest.mark.django_db
def test_should_handle_none_max_duration(
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    recurring_application_event.max_duration = None

    recurring_application_event.save()
    data = AllocationData(application=application_with_reservation_units)

    hour = 60 // ALLOCATION_PRECISION
    assert data.allocation_events[0].min_duration == hour
    assert data.allocation_events[0].max_duration == hour


@pytest.mark.django_db
def test_should_map_period_start_and_end_from_application_period(
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    data = AllocationData(application=application_with_reservation_units)

    assert (
        data.allocation_events[0].period_start
        == application_with_reservation_units.application_period.reservation_period_begin
    )
    assert (
        data.allocation_events[0].period_end
        == application_with_reservation_units.application_period.reservation_period_end
    )


@pytest.mark.django_db
def test_simple_allocation(
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    data = AllocationData(application=application_with_reservation_units)

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    assert (
        solution[0].space_id
        == application_with_reservation_units.application_period.reservation_units.all()[
            0
        ].id
    )
    assert solution[0].event_id == recurring_application_event.id
    assert solution[0].occurrence_id == scheduled_for_monday.id
    assert solution[0].duration == datetime.timedelta(hours=1)
