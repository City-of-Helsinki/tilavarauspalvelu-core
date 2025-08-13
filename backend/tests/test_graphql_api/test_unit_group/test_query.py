from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import UnitFactory, UnitGroupFactory, UserFactory

from .helpers import unit_groups_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_unit_groups__query(graphql):
    unit_1 = UnitFactory.create(rank=1)
    unit_2 = UnitFactory.create(rank=2)
    unit_group = UnitGroupFactory.create(units=[unit_1, unit_2])

    user = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)
    graphql.force_login(user)

    fields = """
        pk
        nameFi
        units {
            pk
            nameFi
        }
    """
    query = unit_groups_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.results == [
        {
            "pk": unit_group.pk,
            "nameFi": unit_group.name_fi,
            "units": [
                {"pk": unit_1.pk, "nameFi": unit_1.name_fi},
                {"pk": unit_2.pk, "nameFi": unit_2.name_fi},
            ],
        }
    ]


def test_unit_groups__query__only_with_permission(graphql):
    UnitGroupFactory.create()

    graphql.login_with_regular_user()

    query = unit_groups_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.results == []


def test_unit_groups__query__unit_groups_with_no_units_are_excluded(graphql):
    UnitGroupFactory.create()

    user = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)
    graphql.force_login(user)

    query = unit_groups_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.results == []
