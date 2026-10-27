from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ApplicationRoundFactory, PriceOptionFactory, ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


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
