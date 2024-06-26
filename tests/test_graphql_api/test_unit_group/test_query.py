import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import UnitFactory, UnitGroupFactory
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_unit_groups__query(graphql):
    unit_1 = UnitFactory.create(rank=1)
    unit_2 = UnitFactory.create(rank=2)
    unit_group = UnitGroupFactory.create(units=[unit_1, unit_2])

    graphql.login_user_based_on_type(UserType.STAFF)

    fields = """
        pk
        nameFi
        units {
            pk
            nameFi
        }
    """
    query = build_query("unitGroups", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": unit_group.pk,
        "nameFi": unit_group.name_fi,
        "units": [
            {"pk": unit_1.pk, "nameFi": unit_1.name_fi},
            {"pk": unit_2.pk, "nameFi": unit_2.name_fi},
        ],
    }


def test_unit_groups__query__only_with_permission(graphql):
    UnitGroupFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    query = build_query("unitGroups", connection=True)
    response = graphql(query)

    assert response.has_errors is True, response
    assert response.error_message() == "No permission to access node."
