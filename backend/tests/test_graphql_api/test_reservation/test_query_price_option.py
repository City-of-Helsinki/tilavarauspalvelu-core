from __future__ import annotations

import pytest
from graphql_relay import to_global_id

from tests.factories import PriceOptionFactory, ReservationFactory, UserFactory

from .helpers import reservation_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Price option ──


def test_reservation__query__price_option_for_own_reservation(graphql):
    user = UserFactory.create()
    price_option = PriceOptionFactory.create(name="Aikuiset")
    reservation = ReservationFactory.create(user=user, price_option=price_option)

    graphql.force_login(user)
    query = reservation_query(fields="priceOption { pk nameFi }", id=to_global_id("ReservationNode", reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceOption": {"pk": price_option.pk, "nameFi": "Aikuiset"}}


def test_reservation__query__price_option_for_other_users_reservation(graphql):
    price_option = PriceOptionFactory.create()
    reservation = ReservationFactory.create(price_option=price_option)

    graphql.login_with_regular_user()
    query = reservation_query(fields="priceOption { pk }", id=to_global_id("ReservationNode", reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceOption": None}


def test_reservation__query__no_price_option(graphql):
    reservation = ReservationFactory.create()

    graphql.login_with_superuser()
    query = reservation_query(fields="priceOption { pk }", id=to_global_id("ReservationNode", reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceOption": None}
