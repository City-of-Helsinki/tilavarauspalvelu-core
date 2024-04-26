import pytest

from tests.factories import UnitFactory, UserFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_reservation_unit__create__draft__anonymous_user(graphql):
    # given:
    # - There is a unit in the system
    # - An anonymous user is using the system
    unit = UnitFactory.create()

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message() == "No permission to create."


def test_reservation_unit__create__draft__regular_user(graphql):
    # given:
    # - There is a unit in the system
    # - A regular user is using the system
    unit = UnitFactory.create()
    graphql.login_with_regular_user()

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message() == "No permission to create."


def test_reservation_unit__create__draft__superuser(graphql):
    # given:
    # - There is a unit in the system
    # - A superuser is using the system
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response doesn't contain errors about missing permissions
    assert response.has_errors is False, response.errors


def test_reservation_unit__create__draft__general_admin(graphql):
    # given:
    # - There is a unit in the system
    # - A general admin is using the system
    unit = UnitFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_manage_reservation_units"])
    graphql.force_login(admin)

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response doesn't contain errors about missing permissions
    assert response.has_errors is False, response.errors


def test_reservation_unit__create__draft__unit_admin(graphql):
    # given:
    # - There is a unit in the system
    # - A unit admin is using the system
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_manage_reservation_units"])
    graphql.force_login(admin)

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response doesn't contain errors about missing permissions
    assert response.has_errors is False, response.errors
