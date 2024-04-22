import pytest

from tests.factories import ReservationUnitFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION, get_draft_update_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_reservation_unit__update__anonymous_user(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - An anonymous user is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message() == "No permission to update."


def test_reservation_unit__update__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    graphql.login_with_regular_user()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_reservation_unit__update__staff_user(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - The given user is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)
    graphql.login_user_based_on_type(UserType.STAFF)

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message() == "No permission to update."


def test_reservation_unit__update__regular_user__with_timeslots(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)
    graphql.login_with_superuser()

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
