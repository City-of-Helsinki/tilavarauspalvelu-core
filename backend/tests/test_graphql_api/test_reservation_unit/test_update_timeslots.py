from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import WeekdayChoice

from tests.factories import ApplicationRoundTimeSlotFactory, ReservationUnitFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__update__timeslots__add(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.TUESDAY.value,
                "isClosed": True,
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The reservation unit has the new timeslots
    assert response.has_errors is False, response
    reservation_unit.refresh_from_db()
    time_slots = list(reservation_unit.application_round_time_slots.all())
    assert len(time_slots) == 2
    assert time_slots[0].weekday == WeekdayChoice.MONDAY
    assert time_slots[1].weekday == WeekdayChoice.TUESDAY


def test_reservation_unit__update__timeslots__replace(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit, weekday=WeekdayChoice.MONDAY)
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit, weekday=WeekdayChoice.FRIDAY)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.TUESDAY.value,
                "isClosed": True,
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The reservation unit has the new timeslots, and not the old ones
    assert response.has_errors is False, response
    reservation_unit.refresh_from_db()
    time_slots = list(reservation_unit.application_round_time_slots.all())
    assert len(time_slots) == 2
    assert time_slots[0].weekday == WeekdayChoice.MONDAY
    assert time_slots[1].weekday == WeekdayChoice.TUESDAY


def test_reservation_unit__update__timeslots__remove_all(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit, weekday=WeekdayChoice.FRIDAY)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit without new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The reservation unit has no timeslots anymore
    assert response.has_errors is False, response
    reservation_unit.refresh_from_db()
    time_slots = list(reservation_unit.application_round_time_slots.all())
    assert len(time_slots) == 0


def test_reservation_unit__update__timeslots__weekday_required(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    # - The timeslots are missing the required weekday field
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about requiring weekday
    assert response.has_errors is True, response
    assert "Field 'weekday' of required" in response.error_message()


def test_reservation_unit__update__timeslots__begin_before_end(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "12:00", "end": "10:00"},
                ],
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    # - The timeslots are missing the required weekday field
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about end time being before begin time
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("applicationRoundTimeSlots") == [
        {
            "reservableTimes": [
                "Timeslot 1 begin time must be before end time.",
            ],
        }
    ]


def test_reservation_unit__update__timeslots__overlapping_reservable_times(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                    {"begin": "11:00", "end": "15:00"},
                ],
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    # - The timeslots are missing the required weekday field
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about overlapping reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("applicationRoundTimeSlots") == [
        {
            "reservableTimes": [
                "Timeslot 1 (10:00:00 - 12:00:00) overlaps with timeslot 2 (11:00:00 - 15:00:00).",
            ],
        }
    ]


def test_reservation_unit__update__timeslots__two_for_same_day(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "isClosed": True,
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    # - The timeslots are missing the required weekday field
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about multiple timeslots for the same day
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("applicationRoundTimeSlots") == [
        "Got multiple timeslots for Monday.",
    ]


def test_reservation_unit__update__timeslots__open_has_no_reservable_times(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [],
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    # - The timeslots are missing the required weekday field
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about no reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("applicationRoundTimeSlots") == [
        "Open timeslots must have reservable times.",
    ]


def test_reservation_unit__update__timeslots__closed_has_reservable_times(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "isClosed": True,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    # - The timeslots are missing the required weekday field
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about closed timeslot having reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("applicationRoundTimeSlots") == [
        "Closed timeslots cannot have reservable times.",
    ]


def test_reservation_unit__update__reservation_block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True, reservation_block_whole_day=False)
    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit.pk,
        "reservationBlockWholeDay": True,
        "pricings": [],
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.reservation_block_whole_day is True
