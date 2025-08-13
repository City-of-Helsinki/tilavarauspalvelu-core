from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import ReservationFactory, UserFactory

from .helpers import DENY_MUTATION, get_deny_data

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("role", [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN])
def test_reservation__deny__allowed(graphql, role):
    user = UserFactory.create_with_general_role(role=role)
    graphql.force_login(user)

    reservation = ReservationFactory.create_for_deny()

    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors


def test_reservation__deny__allowed__own(graphql):
    # Reservers are allowed to deny their own reservations.
    user = UserFactory.create_with_general_role(role=UserRoleChoice.RESERVER)
    graphql.force_login(user)

    reservation = ReservationFactory.create_for_deny(user=user)

    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors


def test_reservation__deny__not_allowed(graphql):
    graphql.login_with_regular_user()
    reservation = ReservationFactory.create_for_deny()

    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, variables={"input": data})

    assert response.has_errors is True, response.errors
    assert response.error_message(0) == "No permission to deny this reservation."


def test_reservation__deny__not_allowed__own(graphql):
    # Regular users are not allowed to deny their own reservations without required role.
    user = graphql.login_with_regular_user()
    reservation = ReservationFactory.create_for_deny(user=user)

    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, variables={"input": data})

    assert response.has_errors is True, response.errors
    assert response.error_message(0) == "No permission to deny this reservation."
