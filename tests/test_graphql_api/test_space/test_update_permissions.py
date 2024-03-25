import pytest

from tests.factories import ServiceSectorFactory, SpaceFactory, UnitFactory, UserFactory
from tests.helpers import UserType

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
    graphql.login_user_based_on_type(UserType.REGULAR)

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
    admin = UserFactory.create_with_unit_permissions(unit=space.unit, perms=["can_manage_spaces"])
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
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has errors about permissions
    assert response.error_message() == "No permission to update."


def test_service_sector_admin_can_update_space(graphql):
    # given:
    # - There is a space
    # - A service sector admin for the space's unit's service sector is using the system
    space = SpaceFactory.create(name="foo", unit__service_sectors__name="foo")
    sector = space.unit.service_sectors.first()
    admin = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_service_sector_admin_can_update_space_for_other_service_sector(graphql):
    # given:
    # - There is a space
    # - A service sector admin for the space's unit's service sector is using the system
    space = SpaceFactory.create(name="foo", unit__service_sectors__name="foo")
    sector = ServiceSectorFactory.create(name="bar")
    admin = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_manage_spaces"])
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
    admin = UserFactory.create_with_general_permissions(perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to update the space's name
    response = graphql(UPDATE_MUTATION, input_data={"pk": space.pk, "nameFi": "bar"})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
