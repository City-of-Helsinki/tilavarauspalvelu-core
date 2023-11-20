import pytest

from applications.choices import WeekdayChoice
from reservation_units.models import ReservationUnit
from tests.factories import UnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_create_reservation_unit_with_timeslots(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.TUESDAY.value,
                "closed": True,
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The reservation unit is created
    # - The reservation unit has two timeslots
    assert response.has_errors is False, response
    reservation_units = list(ReservationUnit.objects.all())
    assert len(reservation_units) == 1
    assert reservation_units[0].application_round_time_slots.count() == 2


def test_create_reservation_unit_with_timeslots__weekday_required(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot is missing weekday
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about requiring weekday
    assert response.has_errors is True, response
    assert "Field 'weekday' of required" in response.error_message()


def test_create_reservation_unit_with_timeslots__begin_before_end(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "12:00", "end": "10:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot reservable times overlap
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about end time being before begin time
    assert response.has_errors is True, response
    assert response.error_message() == "Timeslot 1 begin time must be before end time."


def test_create_reservation_unit_with_timeslots__overlapping_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                    {"begin": "11:00", "end": "15:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - Timeslot reservable times overlap
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about overlapping reservable times
    assert response.has_errors is True, response
    assert response.error_message() == (
        "Timeslot 1 (10:00:00 - 12:00:00) overlaps with timeslot 2 (11:00:00 - 15:00:00)."
    )


def test_create_reservation_unit_with_timeslots__two_for_same_day(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "closed": True,
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about multiple timeslots for the same day
    assert response.has_errors is True, response
    assert response.error_message() == "Got multiple timeslots for Monday."


def test_create_reservation_unit_with_timeslots__open_has_no_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about no reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Open timeslots must have reservable times."


def test_create_reservation_unit_with_timeslots__closed_has_reservable_times(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "closed": True,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    # - There are two timeslots for the same day
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors about closed timeslot having reservable times
    assert response.has_errors is True, response
    assert response.error_message() == "Closed timeslots cannot have reservable times."
