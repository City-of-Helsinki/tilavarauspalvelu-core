from __future__ import annotations

import pytest

from tests.factories import RecurringReservationFactory, ReservationUnitFactory, UserFactory

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__query__regular_user__can_only_see_own(graphql):
    user = graphql.login_with_regular_user()

    recurring_reservation = RecurringReservationFactory.create(user=user)
    RecurringReservationFactory.create()

    query = recurring_reservations_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__query__general_admin(graphql):
    user = UserFactory.create_with_general_role()
    recurring_reservation_1 = RecurringReservationFactory.create(name="1", user=user)
    recurring_reservation_2 = RecurringReservationFactory.create(name="2")

    graphql.force_login(user)

    query = recurring_reservations_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__query__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    recurring_reservation_1 = RecurringReservationFactory.create(name="1", user=user)
    recurring_reservation_2 = RecurringReservationFactory.create(name="2", reservation_unit=reservation_unit)
    recurring_reservation_3 = RecurringReservationFactory.create(name="3")

    graphql.force_login(user)

    query = recurring_reservations_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}
    assert response.node(2) == {"pk": recurring_reservation_3.pk}
