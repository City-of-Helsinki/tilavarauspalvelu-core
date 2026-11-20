from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ApplicationFactory, ApplicationRoundFactory, PriceOptionFactory, ReservationUnitFactory
from tests.test_graphql_api.test_application.helpers import applications_query
from tests.test_graphql_api.test_application_round.helpers import rounds_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Top-level query ──


def test_application_round_price_options(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open(
        reservation_units=[ReservationUnitFactory.create()],
    )
    price_option = PriceOptionFactory.create_for_application_round(application_round, name="Adults")

    query = build_query("applicationRoundPriceOptions", fields="pk nameFi", application_round=application_round.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.json["data"]["applicationRoundPriceOptions"] == [{"pk": price_option.pk, "nameFi": "Adults"}]


def test_application_round_price_options__none_offered(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open(
        reservation_units=[ReservationUnitFactory.create()],
    )

    query = build_query("applicationRoundPriceOptions", fields="pk", application_round=application_round.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.json["data"]["applicationRoundPriceOptions"] == []


def test_application_round_price_options__round_not_found(graphql):
    query = build_query("applicationRoundPriceOptions", fields="pk", application_round=0)
    response = graphql(query)

    assert response.error_message() == "Application round with pk 0 does not exist."


# ── Round field ──


def test_application_round__price_options(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open(
        reservation_units=[ReservationUnitFactory.create()],
    )
    price_option = PriceOptionFactory.create_for_application_round(application_round, name="Adults")
    graphql.login_with_superuser()

    response = graphql(rounds_query(fields="priceOptions { pk nameFi }"))

    assert response.has_errors is False, response
    assert response.node(0) == {"priceOptions": [{"pk": price_option.pk, "nameFi": "Adults"}]}


def test_application_round__price_options__through_application(graphql):
    application = ApplicationFactory.create_in_status_draft(
        application_round__reservation_units=[ReservationUnitFactory.create()],
    )
    price_option = PriceOptionFactory.create_for_application_round(application.application_round, name="Adults")
    graphql.force_login(application.user)

    response = graphql(applications_query(fields="applicationRound { priceOptions { pk nameFi } }"))

    assert response.has_errors is False, response
    assert response.node(0) == {"applicationRound": {"priceOptions": [{"pk": price_option.pk, "nameFi": "Adults"}]}}
