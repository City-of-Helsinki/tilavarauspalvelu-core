from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time
from graphene_django_extensions.testing import build_query

from utils.date_utils import local_date, local_datetime

from tests.factories import TaxLevelFactory, TaxLevelRateFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_tax_levels__query(graphql):
    today = local_date()

    tax_level_1 = TaxLevelFactory.create(name="Yleinen", rates__percentage=Decimal(24))
    TaxLevelRateFactory.create(tax_level=tax_level_1, begins=today, percentage=Decimal("25.5"))
    TaxLevelRateFactory.create(tax_level=tax_level_1, begins=today + datetime.timedelta(days=1), percentage=Decimal(27))

    TaxLevelFactory.create(name="Veroton", rates__percentage=Decimal(0))

    query = build_query("taxLevels", fields="nameFi currentPercentage", connection=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert len(response.edges) == 2
    assert response.node(0) == {"nameFi": "Yleinen", "currentPercentage": "25.50"}
    assert response.node(1) == {"nameFi": "Veroton", "currentPercentage": "0.00"}


def test_tax_levels__query__current_percentage_changes_with_date(graphql):
    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(24), rates__begins=datetime.date(2024, 1, 1))
    TaxLevelRateFactory.create(tax_level=tax_level, begins=datetime.date(2024, 9, 1), percentage=Decimal("25.5"))

    query = build_query("taxLevels", fields="currentPercentage", connection=True)

    with freeze_time(local_datetime(2024, 8, 31, 23, 59)):
        response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.node(0) == {"currentPercentage": "24.00"}

    with freeze_time(local_datetime(2024, 9, 1, 0, 1)):
        response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.node(0) == {"currentPercentage": "25.50"}


def test_tax_levels__query__no_rate_in_effect(graphql):
    today = local_date()

    tax_level = TaxLevelFactory.create(name="Uusi", rates=[])
    TaxLevelRateFactory.create(tax_level=tax_level, begins=today + datetime.timedelta(days=1), percentage=Decimal(14))

    query = build_query("taxLevels", fields="nameFi currentPercentage", connection=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert len(response.edges) == 1
    assert response.node(0) == {"nameFi": "Uusi", "currentPercentage": None}
