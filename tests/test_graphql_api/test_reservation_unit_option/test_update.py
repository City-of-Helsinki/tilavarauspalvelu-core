import pytest

from tests.factories import ReservationUnitOptionFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_option__update__locked(graphql):
    # given:
    # - There is a usable reservation unit option
    # - A superuser is using the system
    option = ReservationUnitOptionFactory.create(locked=False, rejected=False)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to update the reservation unit option
    input_data = {
        "pk": option.pk,
        "locked": True,
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The reservation unit is now locked
    assert response.has_errors is False, response

    option.refresh_from_db()
    assert option.locked is True


def test_reservation_unit_option__update__rejected(graphql):
    # given:
    # - There is a usable reservation unit option
    # - A superuser is using the system
    option = ReservationUnitOptionFactory.create(locked=False, rejected=False)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to update the reservation unit option
    input_data = {
        "pk": option.pk,
        "rejected": True,
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The reservation unit is now rejected
    assert response.has_errors is False, response

    option.refresh_from_db()
    assert option.rejected is True
