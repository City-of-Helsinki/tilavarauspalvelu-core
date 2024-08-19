import pytest
from graphene_django_extensions.testing import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_tax_percentages__query(graphql):
    graphql.login_with_superuser()

    query = build_query("taxPercentages", fields="value", connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 5
    assert response.node(0) == {"value": "0.00"}
    assert response.node(1) == {"value": "10.00"}
    assert response.node(2) == {"value": "14.00"}
    assert response.node(3) == {"value": "24.00"}
    assert response.node(4) == {"value": "25.50"}
