import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import SalesItemFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_sales_items__query(graphql):
    sales_item = SalesItemFactory.create(name="Tilavuokra", material="12345678", main_ledger_account="340025")

    query = build_query("salesItems", fields="pk name taxLevel { pk }", connection=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": sales_item.pk,
        "name": "Tilavuokra",
        "taxLevel": {"pk": sales_item.tax_level.pk},
    }
