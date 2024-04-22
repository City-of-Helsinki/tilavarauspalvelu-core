import pytest

from tests.factories import UnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


def test_reservation_unit__create__draft__anonymous(graphql):
    # given:
    # - There is a unit in the system
    # - An anonymous user is using the system
    unit = UnitFactory.create()

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit
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
    # - The user tries to create a new reservation unit
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message() == "No permission to create."


def test_reservation_unit__create__draft__staff_user(graphql):
    # given:
    # - There is a unit in the system
    # - A staff user is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.STAFF)

    data = {"isDraft": True, "name": "foo", "unit": unit.pk}

    # when:
    # - The user tries to create a new reservation unit
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
    # - The user tries to create a new reservation unit
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response does not contain any errors
    assert response.has_errors is False, response
