import pytest

from tests.factories import ReservationUnitOptionFactory
from tilavarauspalvelu.enums import Weekday

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_option__update__locked(graphql):
    # given:
    # - There is a usable reservation unit option
    # - A superuser is using the system
    option = ReservationUnitOptionFactory.create()
    graphql.login_with_superuser()

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
    option = ReservationUnitOptionFactory.create()
    graphql.login_with_superuser()

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


def test_reservation_unit_option__update__rejected__has_allocations(graphql):
    # given:
    # - There is a usable reservation unit option with allocations
    # - A superuser is using the system
    option = ReservationUnitOptionFactory.create(allocated_time_slots__day_of_the_week=Weekday.MONDAY)
    graphql.login_with_superuser()

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
    assert response.field_error_messages("rejected") == ["Cannot reject a reservation unit option with allocations"]
