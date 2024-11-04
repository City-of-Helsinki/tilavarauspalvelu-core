import pytest
from graphene_django.settings import graphene_settings

from tests.factories import UnitFactory, UserFactory
from tests.test_graphql_api.test_unit.helpers import units_all_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_unit_all__no_pagination_limit(graphql):
    graphene_settings.RELAY_CONNECTION_MAX_LIMIT = 1

    UnitFactory.create_batch(2)

    graphql.login_with_superuser()
    query = units_all_query(fields="pk nameFi nameEn nameSv tprekId")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.first_query_object) == 2


def test_unit_all__filter__by_name_fi(graphql):
    unit = UnitFactory.create(name_fi="foo")
    UnitFactory.create(name_fi="bar")

    query = units_all_query(nameFi="foo")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.first_query_object) == 1
    assert response.first_query_object[0] == {"pk": unit.pk}


def test_unit_all__filter__only_with_permission__general_admin(graphql):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    query = units_all_query(onlyWithPermission=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.first_query_object) == 2
    assert response.first_query_object[0] == {"pk": unit_1.pk}
    assert response.first_query_object[1] == {"pk": unit_2.pk}
