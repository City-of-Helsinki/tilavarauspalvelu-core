import pytest
from graphene_django.settings import graphene_settings

from tests.factories import EquipmentFactory

from .helpers import equipments_all_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_all__no_pagination_limit(graphql):
    graphene_settings.RELAY_CONNECTION_MAX_LIMIT = 1

    EquipmentFactory.create_batch(2)

    graphql.login_with_superuser()
    query = equipments_all_query(fields="nameFi")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.first_query_object) == 2


def test_equipment_all__order_by__category_rank(graphql):
    EquipmentFactory.create(name="1", category__rank=2)
    EquipmentFactory.create(name="2", category__rank=1)
    EquipmentFactory.create(name="3", category__rank=3)

    graphql.login_with_superuser()
    query = equipments_all_query(fields="nameFi", order_by="categoryRankAsc")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.first_query_object) == 3

    assert response.first_query_object[0] == {"nameFi": "2"}
    assert response.first_query_object[1] == {"nameFi": "1"}
    assert response.first_query_object[2] == {"nameFi": "3"}
