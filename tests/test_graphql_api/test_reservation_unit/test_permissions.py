import pytest

from applications.choices import WeekdayChoice
from tests.factories import ReservationUnitFactory, UnitFactory
from tests.factories.application_round_time_slot import ApplicationRoundTimeSlotFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION, TIMESLOTS_QUERY, UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize(
    ("user_type", "expected_timeslots"),
    [
        (UserType.ANONYMOUS, 1),
        (UserType.REGULAR, 1),
        (UserType.STAFF, 1),
        (UserType.SUPERUSER, 1),
    ],
)
def test_permissions_on_query_reservation_unit_timeslots(graphql, user_type, expected_timeslots):
    # given:
    # - There is a reservation unit with timeslots
    # - The specified user is using the system
    reservation_unit = ReservationUnitFactory.create()
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - The reservation unit timeslots are queried
    response = graphql(TIMESLOTS_QUERY)

    # then:
    # - The response contains the application round timeslots
    assert response.has_errors is False, response
    assert len(response.edges) == expected_timeslots


@pytest.mark.parametrize(
    ("user_type", "expected_errors"),
    [
        (UserType.ANONYMOUS, True),
        (UserType.REGULAR, True),
        (UserType.STAFF, False),
        (UserType.SUPERUSER, False),
    ],
)
def test_anonymous_user_cannot_create_reservation_unit_with_timeslots(graphql, user_type, expected_errors):
    # given:
    # - There is a unit in the system
    # - The given user is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(user_type)

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
        ],
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.has_errors is expected_errors, response
    if expected_errors:
        assert response.error_message() == "No permission to mutate"


@pytest.mark.parametrize(
    ("user_type", "expected_errors"),
    [
        (UserType.ANONYMOUS, True),
        (UserType.REGULAR, True),
        (UserType.STAFF, False),
        (UserType.SUPERUSER, False),
    ],
)
def test_anonymous_user_cannot_update_reservation_unit_with_timeslots(graphql, user_type, expected_errors):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - The given user is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    graphql.login_user_based_on_type(user_type)

    data = {
        "pk": reservation_unit.pk,
        "applicationRoundTimeSlots": [
            {
                "weekday": WeekdayChoice.MONDAY.value,
                "reservableTimes": [
                    {"begin": "10:00", "end": "12:00"},
                ],
            },
        ],
        "pricings": [],
    }

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.has_errors is expected_errors, response
    if expected_errors:
        assert response.error_message() == "No permission to mutate"
