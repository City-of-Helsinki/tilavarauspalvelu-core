from __future__ import annotations

import pytest

from tests.factories import ReservationSeriesFactory, ReservationUnitFactory, UserFactory

from .helpers import reservation_series_many_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_series__query__regular_user__can_only_see_own(graphql):
    user = graphql.login_with_regular_user()

    reservation_series = ReservationSeriesFactory.create(user=user)
    ReservationSeriesFactory.create()

    query = reservation_series_many_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_series.pk}


def test_reservation_series__query__general_admin(graphql):
    user = UserFactory.create_with_general_role()
    reservation_series_1 = ReservationSeriesFactory.create(name="1", user=user)
    reservation_series_2 = ReservationSeriesFactory.create(name="2")

    graphql.force_login(user)

    query = reservation_series_many_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}


def test_reservation_series__query__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    reservation_series_1 = ReservationSeriesFactory.create(name="1", user=user)
    reservation_series_2 = ReservationSeriesFactory.create(name="2", reservation_unit=reservation_unit)
    reservation_series_3 = ReservationSeriesFactory.create(name="3")

    graphql.force_login(user)

    query = reservation_series_many_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}
    assert response.node(2) == {"pk": reservation_series_3.pk}
