import pytest

from tests.factories import ReservationUnitOptionFactory, UserFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_option__update__anonymous_user(graphql):
    # given:
    # - There is a usable reservation unit option
    # - A regular user is using the system
    option = ReservationUnitOptionFactory.create(locked=False, rejected=False)
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - User tries to update the reservation unit option
    input_data = {
        "pk": option.pk,
        "locked": True,
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to update."


def test_reservation_unit_option__update__regular_user(graphql):
    # given:
    # - There is a usable reservation unit option
    # - A regular user is using the system
    option = ReservationUnitOptionFactory.create(locked=False, rejected=False)
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to update the reservation unit option
    input_data = {
        "pk": option.pk,
        "locked": True,
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to update."


def test_reservation_unit_option__update__general_admin(graphql):
    # given:
    # - There is a usable reservation unit option
    # - A general admin is using the system
    option = ReservationUnitOptionFactory.create(locked=False, rejected=False)

    admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(admin)

    # when:
    # - User tries to update the reservation unit option
    input_data = {
        "pk": option.pk,
        "locked": True,
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response has no errors
    assert response.has_errors is False
