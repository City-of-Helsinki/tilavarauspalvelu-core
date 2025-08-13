from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ReservationStateChoice, UserRoleChoice

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory

from .helpers import APPROVE_MUTATION, get_approve_data

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("role", [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN])
def test_reservation__approve__allowed(graphql, role):
    reservation_unit = ReservationUnitFactory.create_paid_on_site()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    data = get_approve_data(reservation)
    user = UserFactory.create_with_general_role(role=role)
    graphql.force_login(user)

    response = graphql(APPROVE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors


def test_reservation__approve__allowed__own(graphql):
    # Reservers are allowed to approve their own reservations.
    user = UserFactory.create_with_general_role(role=UserRoleChoice.RESERVER)
    graphql.force_login(user)

    reservation_unit = ReservationUnitFactory.create_paid_on_site()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        user=user,
    )

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors


def test_reservation__approve__not_allowed(graphql):
    graphql.login_with_regular_user()

    reservation_unit = ReservationUnitFactory.create_paid_on_site()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, variables={"input": data})

    assert response.has_errors is True, response.errors
    assert response.error_message(0) == "No permission to approve reservation."


def test_reservation__approve__not_allowed__own(graphql):
    # Regular users are not approve to approve their own reservations without required role.
    user = graphql.login_with_regular_user()

    reservation_unit = ReservationUnitFactory.create_paid_on_site()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        user=user,
    )

    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, variables={"input": data})

    assert response.has_errors is True, response.errors
    assert response.error_message(0) == "No permission to approve reservation."
