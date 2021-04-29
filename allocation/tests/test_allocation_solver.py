import datetime

import pytest

from allocation.allocation_data_builder import AllocationDataBuilder
from allocation.allocation_solver import AllocationSolver
from applications.models import EventReservationUnit


@pytest.mark.django_db
def test_when_matching_unit_in_application_and_application_round_can_be_allocated(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
    matching_event_reservation_unit,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    assert (
        solution[0].space_id
        == application_with_reservation_units.application_round.reservation_units.all()[
            0
        ].id
    )
    assert solution[0].event_id == recurring_application_event.id
    assert solution[0].occurrence_id == scheduled_for_monday.id
    assert solution[0].duration == datetime.timedelta(hours=1)


@pytest.mark.django_db
def test_non_matching_unit_in_application_and_application_round_can_not_be_allocated(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
    not_matching_event_reservation_unit,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

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
                    {
                        "events": [
                            {
                                "events_per_week": 1,
                                "duration": 300,
                                "schedules": [{"day": 0}],
                            }
                        ]
                    },
                    {
                        "events": [
                            {
                                "events_per_week": 1,
                                "duration": 300,
                                "schedules": [{"day": 0}],
                            }
                        ]
                    },
                    {
                        "events": [
                            {
                                "events_per_week": 1,
                                "duration": 300,
                                "schedules": [{"day": 0}],
                            }
                        ]
                    },
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_only_allocate_events_which_fit_within_capacity(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

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
                    {
                        "events": [
                            {
                                "duration": 15,
                                "events_per_week": 1,
                                "schedules": [{"day": 0}, {"day": 1}, {"day": 2}],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_only_give_requested_number_of_events(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    # Requested 1 event per week with 3 possible times
    assert len(solution) == 1
    assert solution[0].duration == datetime.timedelta(minutes=15)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "10:30"}
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_not_allocate_if_given_timeframe_cant_contain_duration(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

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
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "10:30"},
                                    {"day": 0, "start": "18:00", "end": "20:00"},
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_be_able_to_allocate_if_long_enough_slot_with_too_small_slot(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    assert len(solution) == 1
    start_times = []
    for sol in solution:
        start_times.append(sol.begin)

    assert start_times == [datetime.time(hour=18, minute=0)]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "12:00"}
                                ],
                            },
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "12:00"}
                                ],
                            },
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_start_and_end_between_requested_times_and_not_overlap_in_space(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 2
    start_times = []
    end_times = []
    for sol in solution:
        start_times.append(sol.begin)
        end_times.append(sol.end)

    assert start_times == [
        datetime.time(hour=10, minute=0),
        datetime.time(hour=11, minute=0),
    ]
    assert end_times == [
        datetime.time(hour=11, minute=0),
        datetime.time(hour=12, minute=0),
    ]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            },
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            },
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_not_allocate_if_events_need_to_overlap(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    start_times = []
    for sol in solution:
        start_times.append(sol.begin)

    assert start_times == [datetime.time(hour=10, minute=0)]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            },
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            },
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_events_can_overlap_in_different_units(
    application_round_with_reservation_units,
    multiple_applications,
    second_reservation_unit,
    reservation_unit,
):
    application_round_with_reservation_units.reservation_units.set(
        [reservation_unit, second_reservation_unit]
    )

    for application in application_round_with_reservation_units.applications.all():

        for event in application.application_events.all():
            unit_one = event.event_reservation_units.all()[0]
            unit_two = EventReservationUnit.objects.create(
                priority=100,
                application_event=event,
                reservation_unit=second_reservation_unit,
            )
            event.event_reservation_units.set([unit_one, unit_two])
            event.num_persons = 5
            event.save()

        application_round_with_reservation_units.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 2
    start_times = []
    end_times = []
    for sol in solution:
        start_times.append(sol.begin)
        end_times.append(sol.end)

    assert start_times == [
        datetime.time(hour=10, minute=0),
        datetime.time(hour=10, minute=0),
    ]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:18", "end": "12:00"}
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_allocate_with_15_minutes_precision_rounded_up(
    application_round_with_reservation_units, multiple_applications
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    assert solution[0].begin == datetime.time(hour=10, minute=30)
    assert solution[0].end == datetime.time(hour=11, minute=30)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            },
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            },
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_restrict_allocation_by_unit_max_persons(
    application_round_with_reservation_units,
    multiple_applications,
    second_reservation_unit,
    reservation_unit,
):
    application_round_with_reservation_units.reservation_units.set(
        [reservation_unit, second_reservation_unit]
    )

    for application in application_round_with_reservation_units.applications.all():

        for event in application.application_events.all():
            unit_one = event.event_reservation_units.all()[0]
            unit_two = EventReservationUnit.objects.create(
                priority=100,
                application_event=event,
                reservation_unit=second_reservation_unit,
            )
            event.event_reservation_units.set([unit_one, unit_two])
            event.save()

        application_round_with_reservation_units.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    start_times = []
    end_times = []
    for sol in solution:
        start_times.append(sol.begin)
        end_times.append(sol.end)

    assert start_times == [datetime.time(hour=10, minute=0)]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_allocate_when_unit_max_persons_is_none(
    application_round_with_reservation_units,
    multiple_applications,
    reservation_unit,
):
    for space in reservation_unit.spaces.all():
        space.max_persons = None
        space.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1

    assert solution[0].begin == datetime.time(hour=10, minute=0)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "11:00"}
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_allocate_when_event_num_persons_is_none(
    application_round_with_reservation_units,
    multiple_applications,
    reservation_unit,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    for application in application_round_with_reservation_units.applications.all():

        for event in application.application_events.all():
            event.num_persons = None
            event.save()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1
    assert solution[0].begin == datetime.time(hour=10, minute=0)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 2,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"}
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_should_only_allocate_one_event_per_schedule(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    second_reservation_unit,
    reservation_unit,
):
    application_round_with_reservation_units.reservation_units.set(
        [reservation_unit, second_reservation_unit]
    )

    for application in application_round_with_reservation_units.applications.all():

        for event in application.application_events.all():
            unit_one = event.event_reservation_units.all()[0]
            unit_two = EventReservationUnit.objects.create(
                priority=100,
                application_event=event,
                reservation_unit=second_reservation_unit,
            )
            event.event_reservation_units.set([unit_one, unit_two])
            event.num_persons = 5
            event.save()

        application_round_with_reservation_units.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 1

@pytest.mark.django_db
@pytest.mark.parametrize(
    "multiple_applications",
    (
        [
            {
                "applications": [
                    {
                        "events": [
                            {
                                "duration": 60,
                                "events_per_week": 2,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                    {"day": 1, "start": "10:00", "end": "22:00"}
                                ],
                            }
                        ]
                    }
                ]
            }
        ]
    ),
    indirect=True,
)
def test_can_allocate_multiple_to_different_schedules(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    reservation_unit,
):
    application_round_with_reservation_units.reservation_units.set(
        [reservation_unit]
    )


    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert len(solution) == 2