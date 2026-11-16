import pytest

from tests.factories import EquipmentCategoryFactory

from .helpers import equipment_categories_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__query(graphql):
    category = EquipmentCategoryFactory.create(name="foo")

    graphql.login_with_superuser()
    query = equipment_categories_query(fields="nameFi")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node(0) == {
        "nameFi": category.name_fi,
    }
