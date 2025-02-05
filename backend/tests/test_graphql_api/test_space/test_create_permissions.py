from __future__ import annotations

import pytest

from tests.factories import UnitFactory, UserFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_spaces__create__regular_user_cannot_create_space(graphql):
    # given:
    # - A superuser is using the system
    graphql.login_with_regular_user()

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"name": "foo"})

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to create."


def test_spaces__create__unit_admin_can_create_space(graphql):
    # given:
    # - A unit admin is using the system
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for the unit they manage
    response = graphql(CREATE_MUTATION, input_data={"name": "foo", "unit": unit.id})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_spaces__create__unit_admin_cannot_create_space_for_other_unit(graphql):
    # given:
    # - A superuser is using the system
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    admin = UserFactory.create_with_unit_role(units=[unit_1])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for some other unit they don't manage
    response = graphql(CREATE_MUTATION, input_data={"name": "foo", "unit": unit_2.id})

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to create."


def test_spaces__create__general_admin_can_create_space(graphql):
    # given:
    # - A general admin is using the system
    UnitFactory.create()
    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for the unit they manage
    response = graphql(CREATE_MUTATION, input_data={"name": "foo"})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
