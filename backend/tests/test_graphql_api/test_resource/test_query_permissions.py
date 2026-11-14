import pytest

from tests.factories import ResourceFactory, UnitGroupFactory, UserFactory

from .helpers import resources_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resources__filter__only_with_permissions__regular_user(graphql):
    ResourceFactory.create()

    graphql.login_with_regular_user()

    query = resources_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.edges == []


def test_resources__filter__only_with_permissions__general_admin__can_manage_resources(graphql):
    resource = ResourceFactory.create()

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    query = resources_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node() == {"pk": resource.pk}


def test_resources__filter__only_with_permissions__unit_admin__can_manage_resources(graphql):
    resource_1 = ResourceFactory.create()
    ResourceFactory.create()

    user = UserFactory.create_with_unit_role(units=[resource_1.space.unit])
    graphql.force_login(user)

    query = resources_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node() == {"pk": resource_1.pk}


def test_resources__filter__only_with_permissions__unit_group_admin__can_manage_resources(graphql):
    resource_1 = ResourceFactory.create()
    ResourceFactory.create()

    unit_group = UnitGroupFactory.create(units=[resource_1.space.unit])

    user = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    graphql.force_login(user)

    query = resources_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node() == {"pk": resource_1.pk}
