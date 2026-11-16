import pytest

from tilavarauspalvelu.models import Reservation

from tests.factories import ReservationFactory, UserFactory

from .helpers import DELETE_MUTATION, get_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__delete__general_admin(graphql):
    reservation = ReservationFactory.create_for_delete()

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False


def test_reservation__delete__reservation_owner(graphql):
    user = UserFactory.create()
    reservation = ReservationFactory.create_for_delete(user=user)

    graphql.force_login(user)
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False


def test_reservation__delete__regular_user(graphql):
    reservation = ReservationFactory.create_for_delete()

    graphql.login_with_regular_user()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to delete."

    assert Reservation.objects.filter(pk=reservation.pk).exists() is True
