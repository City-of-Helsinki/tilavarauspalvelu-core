from __future__ import annotations

from decimal import Decimal

import pytest

from tests.factories import TaxPercentageFactory
from tests.query_builder import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_tax_percentages__query(graphql):
    for value in ["0.0", "10.0", "14.0", "24.0", "25.5"]:
        TaxPercentageFactory.create(value=Decimal(value))

    graphql.login_with_superuser()

    query = build_query("allTaxPercentages", fields="value")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 5
    assert response.results[0] == {"value": "0.00"}
    assert response.results[1] == {"value": "10.00"}
    assert response.results[2] == {"value": "14.00"}
    assert response.results[3] == {"value": "24.00"}
    assert response.results[4] == {"value": "25.50"}
