import pytest

from reservations.enums import ReservationStateChoice
from tests.factories import ReservationFactory
from tilavarauspalvelu.enums import UserRoleChoice

from .helpers import APPROVE_MUTATION, get_approve_data

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("role", [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN])
def test_reservation__approve__allowed(graphql, role):
    graphql.login_user_with_role(role=role)
    reservation = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__approve__allowed__own(graphql):
    # Reservers are allowed to approve their own reservations.
    user = graphql.login_user_with_role(role=UserRoleChoice.RESERVER)
    reservation = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING, user=user)

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__approve__not_allowed(graphql):
    graphql.login_with_regular_user()
    reservation = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is True, response.errors
    assert response.error_message() == "No permission to update."


def test_reservation__approve__not_allowed__own(graphql):
    # Regular users are not approve to approve their own reservations without required role.
    user = graphql.login_with_regular_user()
    reservation = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING, user=user)

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is True, response.errors
    assert response.error_message() == "No permission to update."
