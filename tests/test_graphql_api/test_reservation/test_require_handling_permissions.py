import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import ReservationFactory

from .helpers import REQUIRE_HANDLING_MUTATION, get_require_handling_data

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("role", [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN])
def test_reservation__requires_handling__allowed(graphql, role):
    graphql.login_user_with_role(role=role)
    reservation = ReservationFactory.create_for_requires_handling()

    data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__requires_handling__allowed__own(graphql):
    # Reservers are allowed to set handling required for their own reservations.
    user = graphql.login_user_with_role(role=UserRoleChoice.RESERVER)
    reservation = ReservationFactory.create_for_requires_handling(user=user)

    data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__requires_handling__not_allowed(graphql):
    graphql.login_with_regular_user()
    reservation = ReservationFactory.create_for_requires_handling()

    data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=data)

    assert response.has_errors is True, response.errors
    assert response.error_message() == "No permission to update."


def test_reservation__requires_handling__not_allowed__own(graphql):
    # Regular users are not approve to set handling required for their own reservations without required role.
    user = graphql.login_with_regular_user()
    reservation = ReservationFactory.create_for_requires_handling(user=user)

    data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=data)

    assert response.has_errors is True, response.errors
    assert response.error_message() == "No permission to update."
