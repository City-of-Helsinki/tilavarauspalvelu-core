import pytest

from tests.factories import SpaceFactory, UnitFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_regular_user_cannot_update_space(graphql):
    # given:
    # - There is a space
    # - A regular user is using the system
    space = SpaceFactory.create(name="foo")
    graphql.login_with_regular_user()

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has errors about permissions
    assert response.error_message() == "No permission to update."


def test_unit_admin_can_update_space(graphql):
    # given:
    # - There is a space
    # - A unit admin for the space's unit is using the system
    space = SpaceFactory.create(name="foo")
    admin = UserFactory.create_with_unit_role(units=[space.unit])
    graphql.force_login(admin)

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_unit_admin_cannot_update_space_for_other_unit(graphql):
    # given:
    # - There is a space
    # - A unit admin for some other unit is using the system
    space = SpaceFactory.create(name="foo", unit__name="foo")
    unit = UnitFactory.create(name="bar")
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has errors about permissions
    assert response.error_message() == "No permission to update."


def test_general_admin_can_update_space(graphql):
    # given:
    # - There is a space
    # - A general admin is using the system
    space = SpaceFactory.create(name="foo")
    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
