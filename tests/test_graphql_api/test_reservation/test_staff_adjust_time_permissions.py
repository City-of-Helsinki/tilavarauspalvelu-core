import pytest

from tests.factories import ReservationFactory
from tilavarauspalvelu.enums import UserRoleChoice

from .helpers import ADJUST_STAFF_MUTATION, get_staff_adjust_data

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("role", [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN])
def test_reservation__staff_adjust_time__allowed(graphql, role):
    graphql.login_user_with_role(role=role)
    reservation = ReservationFactory.create_for_time_adjustment()

    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__staff_adjust_time__allowed__own(graphql):
    # Reservers are allowed to adjust their own reservations.
    user = graphql.login_user_with_role(role=UserRoleChoice.RESERVER)
    reservation = ReservationFactory.create_for_time_adjustment(user=user)

    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__staff_adjust_time__not_allowed(graphql):
    graphql.login_with_regular_user()
    reservation = ReservationFactory.create_for_time_adjustment()

    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is True, response.errors
    assert response.error_message() == "No permission to update."


def test_reservation__staff_adjust_time__not_allowed__own(graphql):
    # Regular users are not allowed to adjust their own reservations without required role.
    user = graphql.login_with_regular_user()
    reservation = ReservationFactory.create_for_time_adjustment(user=user)

    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is True, response.errors
    assert response.error_message() == "No permission to update."
