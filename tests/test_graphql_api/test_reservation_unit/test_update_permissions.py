import pytest

from applications.choices import WeekdayChoice
from tests.factories import ReservationUnitFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION, get_draft_update_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_reservation_unit__update__regular_user(graphql):
    graphql.login_user_based_on_type(UserType.REGULAR)

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


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
        assert response.error_message() == "No permission to update."
