import datetime

import pytest

from reservations.allocation_models import AllocationData
from reservations.allocation_solver import AllocationSolver


@pytest.mark.django_db
def test_when_matching_unit_in_application_and_application_period_can_be_allocated(
    application_period_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
    matching_event_reservation_unit,
):

    data = AllocationData(application_period=application_period_with_reservation_units)

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


@pytest.mark.django_db
def test_non_matching_unit_in_application_and_application_period_can_not_be_allocated(
    application_period_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
    not_matching_event_reservation_unit,
):

    data = AllocationData(application_period=application_period_with_reservation_units)

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {"events": [{"events_per_week": 1, "duration": 300, "schedules": [{"day": 0}]}]},
                    {"events": [{"events_per_week": 1, "duration": 300, "schedules": [{"day": 0}]}]},
                    {"events": [{"events_per_week": 1, "duration": 300, "schedules": [{"day": 0}]}]},
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_only_allocate_events_which_fit_within_capacity(
    application_period_with_reservation_units, multiple_applications
):
    data = AllocationData(application_period=application_period_with_reservation_units)

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    # Open 10 hours each day, we have three events to allocate with 300 minutes= 5 hours duration each
    assert len(solution) == 2
    assert solution[0].duration == datetime.timedelta(hours=5)
    assert solution[1].duration == datetime.timedelta(hours=5)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {"events": [{"duration": 15, "events_per_week": 1, "schedules": [{"day": 0}, {"day": 1}, {"day": 2}]}]}
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_only_give_requested_number_of_events(
    application_period_with_reservation_units, multiple_applications
):
    data = AllocationData(application_period=application_period_with_reservation_units)

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    # Open 10 hours each day, we have three events to allocate with 300 minutes= 5 hours duration each
    assert len(solution) == 1
    assert solution[0].duration == datetime.timedelta(hours=5)
    assert solution[1].duration == datetime.timedelta(hours=5)