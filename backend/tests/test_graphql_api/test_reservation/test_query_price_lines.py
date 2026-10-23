from __future__ import annotations

from decimal import Decimal

import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import PriceUnit

from tests.factories import ReservationFactory, ReservationPriceLineFactory, UserFactory

from .helpers import reservation_query, reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


FIELDS = "priceLines { descriptionFi quantity priceUnit unitAmount amount overrideAmount taxPercentage }"


# ── Price lines ──


def test_reservation__query__price_lines_for_own_reservation(graphql):
    user = UserFactory.create()
    reservation = ReservationFactory.create(user=user)
    ReservationPriceLineFactory.create(
        reservation=reservation,
        description_fi="Aikuiset",
        quantity=Decimal(2),
        price_unit=PriceUnit.PER_HOUR,
        unit_amount=Decimal(10),
        amount=Decimal(20),
        override_amount=Decimal(0),
        tax_percentage=Decimal("25.50"),
    )

    graphql.force_login(user)
    query = reservation_query(fields=FIELDS, id=to_global_id("ReservationNode", reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceLines": [
            {
                "descriptionFi": "Aikuiset",
                "quantity": "2.0000",
                "priceUnit": PriceUnit.PER_HOUR.value,
                "unitAmount": "10.00",
                "amount": "20.00",
                "overrideAmount": "0.00",
                "taxPercentage": "25.50",
            },
        ],
    }


def test_reservation__query__price_lines_for_other_users_reservation(graphql):
    reservation = ReservationFactory.create()
    ReservationPriceLineFactory.create(reservation=reservation)

    graphql.login_with_regular_user()
    query = reservation_query(fields=FIELDS, id=to_global_id("ReservationNode", reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceLines": None}


def test_reservation__query__price_lines_for_staff(graphql):
    reservation = ReservationFactory.create()
    ReservationPriceLineFactory.create(reservation=reservation, amount=Decimal(15))

    graphql.login_with_superuser()
    query = reservation_query(fields="priceLines { amount }", id=to_global_id("ReservationNode", reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceLines": [{"amount": "15.00"}]}


def test_reservation__query__price_lines_are_prefetched(graphql):
    for _ in range(3):
        reservation = ReservationFactory.create()
        ReservationPriceLineFactory.create(reservation=reservation)
        ReservationPriceLineFactory.create(reservation=reservation)

    graphql.login_with_superuser()
    query = reservations_query(fields="pk priceLines { amount }")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert all(len(response.node(index)["priceLines"]) == 2 for index in range(3))
    assert len(response.queries) == 6, response.query_log
