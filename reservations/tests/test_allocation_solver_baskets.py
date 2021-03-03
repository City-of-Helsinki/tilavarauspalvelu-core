import pytest
from assertpy import assert_that

from reservations.allocation_data_builder import AllocationDataBuilder
from reservations.allocation_solver import AllocationSolver


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
                                "duration": 600,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                ],
                            },
                            {
                                "duration": 600,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
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
def test_should_prioritize_basket_with_highest_order_number(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    application_round_basket_two,
    purpose2,
    purpose,
):

    application_round_basket_two.purpose = purpose2
    application_round_basket_two.save()

    basket_two_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[0]
    )
    basket_two_event.purpose = purpose2
    basket_two_event.save()

    basket_one_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[1]
    )

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert_that(solution).is_length(1)
    assert_that(solution[0]).has_basket_id(
        application_round_basket_one.id
    ).has_event_id(basket_one_event.id)


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
                                "duration": 600,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                ],
                            },
                            {
                                "duration": 600,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
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
def test_should_allocate_by_basket_priority_even_when_lower_basket_only_included(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    application_round_basket_two,
    purpose2,
    purpose,
):

    application_round_basket_two.purpose = purpose2
    application_round_basket_two.save()

    basket_two_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[0]
    )
    basket_two_event.purpose = purpose2
    basket_two_event.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units,
        output_basket_ids=[application_round_basket_two.id],
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert_that(solution).is_length(0)


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
                                "duration": 600,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                ],
                            },
                            {
                                "duration": 119,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
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
def test_used_capacity_worth_more_than_basket_score(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    application_round_basket_two,
    purpose2,
    purpose,
):

    application_round_basket_two.purpose = purpose2
    application_round_basket_two.save()

    basket_two_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[0]
    )
    basket_two_event.purpose = purpose2
    basket_two_event.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()
    # basket 1 score 10, basket 2 score 5. 600/5 > 119
    assert_that(solution).is_length(1)
    assert_that(solution[0]).has_basket_id(
        application_round_basket_two.id
    ).has_event_id(basket_two_event.id)


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
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                    {"day": 1, "start": "10:00", "end": "22:00"},
                                    {"day": 3, "start": "10:00", "end": "22:00"},
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
def test_can_restrict_by_events_per_week_when_in_multiple_baskets(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    purpose2,
    purpose,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()
    assert_that(solution).is_length(1)
    assert_that(solution[0]).has_basket_id(application_round_basket_one.id)


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
                                "events_per_week": 2,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                    {"day": 1, "start": "10:00", "end": "22:00"},
                                    {"day": 3, "start": "10:00", "end": "22:00"},
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
def test_can_give_multiple_events_from_same_basket_up_to_events_per_week(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    purpose2,
    purpose,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()
    assert_that(solution).is_length(2)


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
                                "duration": 300,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                ],
                            },
                            {
                                "duration": 300,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
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
def test_can_allocate_from_lower_baskets_if_enough_capacity(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    application_round_basket_two,
    purpose2,
    purpose,
):
    application_round_basket_two.purpose = purpose2
    application_round_basket_two.save()

    basket_two_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[0]
    )
    basket_two_event.purpose = purpose2
    basket_two_event.save()

    basket_one_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[1]
    )

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert_that(solution).is_length(2)
    assert_that(solution[0]).has_basket_id(
        application_round_basket_one.id
    ).has_event_id(basket_one_event.id)
    assert_that(solution[1]).has_basket_id(
        application_round_basket_two.id
    ).has_event_id(basket_two_event.id)


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
                                "duration": 300,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
                                ],
                            },
                            {
                                "duration": 300,
                                "events_per_week": 1,
                                "schedules": [
                                    {"day": 0, "start": "10:00", "end": "22:00"},
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
def test_should_restrict_output_by_output_basket_ids(
    application_round_with_reservation_units,
    multiple_applications,
    application_round_basket_one,
    application_round_basket_two,
    purpose2,
    purpose,
):
    application_round_basket_two.purpose = purpose2
    application_round_basket_two.save()

    basket_two_event = (
        multiple_applications["applications"][0]
        .application_events.order_by("id")
        .all()[0]
    )
    basket_two_event.purpose = purpose2
    basket_two_event.save()

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units,
        output_basket_ids=[application_round_basket_two.id],
    ).get_allocation_data()

    solver = AllocationSolver(allocation_data=data)

    solution = solver.solve()

    assert_that(solution).is_length(1)

    assert_that(solution[0]).has_basket_id(
        application_round_basket_two.id
    ).has_event_id(basket_two_event.id)
