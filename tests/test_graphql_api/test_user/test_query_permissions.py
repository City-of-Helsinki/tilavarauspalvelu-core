import pytest
from graphene_django_extensions.testing import build_query
from graphql_relay import to_global_id

from tests.factories import UnitFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__query__unit_admin_read_other(graphql):
    user = UserFactory.create()
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    global_id = to_global_id("UserNode", user.pk)
    query = build_query("user", id=global_id)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {"pk": user.pk}


def test_user__query__regular_user_read_self(graphql):
    user = UserFactory.create()
    graphql.force_login(user)

    global_id = to_global_id("UserNode", user.pk)
    query = build_query("user", id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == {"pk": user.pk}


def test_user__query__regular_user_read_other(graphql):
    user = UserFactory.create()
    other = UserFactory.create()
    graphql.force_login(user)

    global_id = to_global_id("UserNode", other.pk)
    query = build_query("user", id=global_id)
    response = graphql(query)

    assert response.error_message() == "No permission to access node."
