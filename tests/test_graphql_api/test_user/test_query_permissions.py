import pytest

from tests.factories import ServiceSectorFactory, UnitFactory, UserFactory
from tests.gql_builders import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__query__unit_admin_read_other(graphql):
    user = UserFactory.create()
    admin = UserFactory.create_with_unit_permissions(
        unit=UnitFactory.create(),
        perms=["can_view_users"],
    )
    graphql.force_login(admin)

    query = build_query("user", pk=user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {"pk": user.pk}


def test_user__query__service_sector_admin_read_other(graphql):
    user = UserFactory.create()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_view_users"],
    )
    graphql.force_login(admin)

    query = build_query("user", pk=user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {"pk": user.pk}


def test_user__query__regular_user_read_self(graphql):
    user = UserFactory.create()
    graphql.force_login(user)

    query = build_query("user", pk=user.pk)
    response = graphql(query)

    assert response.error_message() == "No permissions to this operation."


def test_user__query__regular_user_read_other(graphql):
    user = UserFactory.create()
    other = UserFactory.create()
    graphql.force_login(user)

    query = build_query("user", pk=other.pk)
    response = graphql(query)

    assert response.error_message() == "No permissions to this operation."
