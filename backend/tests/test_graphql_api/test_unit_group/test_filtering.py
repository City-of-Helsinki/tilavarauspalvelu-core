from __future__ import annotations

import pytest

from tests.factories import UnitFactory, UnitGroupFactory, UserFactory
from tests.test_graphql_api.test_unit_group.helpers import unit_groups_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__filter__only_with_permission__regular_user(graphql):
    unit_group = UnitGroupFactory.create()
    UnitFactory.create(unit_groups=[unit_group])

    graphql.login_with_regular_user()

    query = unit_groups_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is True
    assert response.error_message() == "No permission to access node."


def test_units__filter__only_with_permission__general_admin(graphql):
    UnitFactory.create(unit_groups__name="Included")

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    query = unit_groups_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1


def test_units__filter__only_with_permission__unit_group_admin(graphql):
    UnitFactory.create(unit_groups__name="Excluded")
    unit_group = UnitGroupFactory.create()
    UnitFactory.create(unit_groups=[unit_group])

    user = UserFactory.create_with_unit_role(unit_groups=[unit_group])
    graphql.force_login(user)

    query = unit_groups_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit_group.pk}


def test_units__filter__only_with_permission__unit_admin(graphql):
    UnitFactory.create(unit_groups__name="Excluded")
    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])

    user = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(user)

    query = unit_groups_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit_group.pk}
