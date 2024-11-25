from __future__ import annotations

import pytest

from tests.factories import SpaceFactory, UnitFactory, UserFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_regular_user_cannot_delete_space(graphql):
    # given:
    # - There is a space
    # - A regular user is using the system
    space = SpaceFactory.create()
    graphql.login_with_regular_user()

    # when:
    # - User tries to delete the space
    response = graphql(DELETE_MUTATION, input_data={"pk": space.pk})

    # then:
    # - Response complains about mutation permissions
    assert response.error_message() == "No permission to delete."


def test_unit_admin_can_delete_space(graphql):
    # given:
    # - There is a space
    # - A unit admin for the space's unit is using the system
    space = SpaceFactory.create()
    admin = UserFactory.create_with_unit_role(units=[space.unit])
    graphql.force_login(admin)

    # when:
    # - User tries to delete the space
    response = graphql(DELETE_MUTATION, input_data={"pk": space.pk})

    # then:
    # - Response has no errors
    assert response.has_errors is False, response


def test_unit_admin_can_delete_space_if_not_for_spaces_unit(graphql):
    # given:
    # - There is a space
    # - A unit admin for some other unit is using the system
    space = SpaceFactory.create(unit__name="foo")
    other_unit = UnitFactory.create(name="bar")
    admin = UserFactory.create_with_unit_role(units=[other_unit])
    graphql.force_login(admin)

    # when:
    # - User tries to delete the space
    response = graphql(DELETE_MUTATION, input_data={"pk": space.pk})

    # then:
    # - Response complains about mutation permissions
    assert response.error_message() == "No permission to delete."


def test_general_admin_can_delete_space(graphql):
    # given:
    # - There is a space
    # - A general admin is using the system
    space = SpaceFactory.create()
    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    # when:
    # - User tries to delete the space
    response = graphql(DELETE_MUTATION, input_data={"pk": space.pk})

    # then:
    # - Response has no errors
    assert response.has_errors is False, response
