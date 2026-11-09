from __future__ import annotations

from decimal import Decimal

import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import ReservationStateChoice

from tests.factories import (
    ApplicationSectionFactory,
    PriceOptionFactory,
    ReservationFactory,
    ReservationPriceLineFactory,
    ReservationSeriesFactory,
    ReservationUnitFactory,
    UserFactory,
)

from .helpers import reservation_series_many_query, reservation_series_single_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def create_series_with_price_option(*, name: str):
    price_option = PriceOptionFactory.create(name=name)
    section = ApplicationSectionFactory.create(price_option=price_option)
    series = ReservationSeriesFactory.create(allocated_time_slot__reservation_unit_option__application_section=section)
    for _ in range(2):
        reservation = ReservationFactory.create(
            reservation_series=series,
            total_price=Decimal(10),
            state=ReservationStateChoice.CONFIRMED,
        )
        ReservationPriceLineFactory.create(reservation=reservation, amount=Decimal(10))
    return series


# ── Price ──


def test_reservation_series__query__price_sums_reservations_that_are_going_to_occur(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series, total_price=Decimal(10), state=ReservationStateChoice.CONFIRMED
    )
    ReservationFactory.create(
        reservation_series=series,
        total_price=Decimal(20),
        state=ReservationStateChoice.REQUIRES_HANDLING,
    )
    ReservationFactory.create(
        reservation_series=series, total_price=Decimal(100), state=ReservationStateChoice.CANCELLED
    )
    ReservationFactory.create(reservation_series=series, total_price=Decimal(100), state=ReservationStateChoice.DENIED)

    graphql.login_with_superuser()
    query = reservation_series_single_query(fields="totalPrice", id=to_global_id("ReservationSeriesNode", series.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"totalPrice": "30.00"}


def test_reservation_series__query__price_without_reservations(graphql):
    series = ReservationSeriesFactory.create()

    graphql.login_with_superuser()
    query = reservation_series_single_query(fields="totalPrice", id=to_global_id("ReservationSeriesNode", series.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"totalPrice": "0.00"}


# ── Price option ──


def test_reservation_series__query__price_option_from_application_section(graphql):
    series = create_series_with_price_option(name="Aikuiset")

    graphql.login_with_superuser()
    query = reservation_series_single_query(
        fields="priceOption { nameFi }",
        id=to_global_id("ReservationSeriesNode", series.pk),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceOption": {"nameFi": "Aikuiset"}}


def test_reservation_series__query__price_option_without_allocated_time_slot(graphql):
    series = ReservationSeriesFactory.create()

    graphql.login_with_superuser()
    query = reservation_series_single_query(
        fields="priceOption { nameFi }",
        id=to_global_id("ReservationSeriesNode", series.pk),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceOption": None}


def test_reservation_series__query__prices_of_many_series_do_not_grow_queries(graphql):
    graphql.login_with_superuser()
    fields = "pk totalPrice priceOption { nameFi } reservations { totalPrice priceLines { amount } }"

    create_series_with_price_option(name="Aikuiset")
    response = graphql(reservation_series_many_query(fields=fields))
    assert response.has_errors is False, response
    response.assert_query_count(7)

    create_series_with_price_option(name="Juniorit")
    create_series_with_price_option(name="Seniorit")
    response = graphql(reservation_series_many_query(fields=fields))
    assert response.has_errors is False, response

    assert len(response.edges) == 3
    assert sorted(response.node(index)["priceOption"]["nameFi"] for index in range(3)) == [
        "Aikuiset",
        "Juniorit",
        "Seniorit",
    ]
    assert all(response.node(index)["totalPrice"] == "20.00" for index in range(3))
    response.assert_query_count(7)


# ── Permissions ──


def test_reservation_series__query__prices_for_staff_without_permission_to_the_series(graphql):
    series = create_series_with_price_option(name="Aikuiset")
    other_unit = ReservationUnitFactory.create().unit
    user = UserFactory.create_with_unit_role(units=[other_unit])

    graphql.force_login(user)
    query = reservation_series_single_query(
        fields="pk totalPrice priceOption { nameFi }",
        id=to_global_id("ReservationSeriesNode", series.pk),
    )
    response = graphql(query)

    assert response.error_message("totalPrice") == "No permission to access field."
    assert response.error_message("priceOption") == "No permission to access field."
    assert response.first_query_object == {"pk": series.pk, "totalPrice": None, "priceOption": None}
