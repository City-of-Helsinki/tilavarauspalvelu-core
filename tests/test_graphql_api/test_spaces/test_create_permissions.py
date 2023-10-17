import pytest

from tests.factories import ServiceSectorFactory, UnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_regular_user_cannot_create_space(graphql):
    # given:
    # - A superuser is using the system
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo"})

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to mutate"


def test_unit_admin_can_create_space(graphql):
    # given:
    # - A unit admin is using the system
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for the unit they manage
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo", "unitPk": unit.id})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_unit_admin_cannot_create_space_for_other_unit(graphql):
    # given:
    # - A superuser is using the system
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit=unit_1, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for some other unit they don't manage
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo", "unitPk": unit_2.id})

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to mutate"


def test_service_sector_admin_can_create_space(graphql):
    # given:
    # - A service sector admin for one of the space's unit's service sectors is using the system
    unit = UnitFactory.create(service_sectors__name="foo")
    sector = unit.service_sectors.first()
    admin = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for a unit in a service sector they manage
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo", "unitPk": unit.id})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_service_sector_admin_cannot_create_space_for_other_service_sector(graphql):
    # given:
    # - A service sector admin for some other service sector is using the system
    unit = UnitFactory.create(service_sectors__name="foo")
    sector = ServiceSectorFactory.create(name="bar")
    admin = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for a unit in a service sector they don't manage
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo", "unitPk": unit.id})

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to mutate"


def test_general_admin_can_create_space(graphql):
    # given:
    # - A general admin is using the system
    UnitFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_manage_spaces"])
    graphql.force_login(admin)

    # when:
    # - User tries to create a space for the unit they manage
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo"})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
