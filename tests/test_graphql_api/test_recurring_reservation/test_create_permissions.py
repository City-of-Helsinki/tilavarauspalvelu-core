import pytest

from tests.factories import ReservationUnitFactory, UserFactory
from tilavarauspalvelu.models import RecurringReservation

from .helpers import CREATE_MUTATION, get_minimal_create_date

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__create__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_regular_user()

    data = get_minimal_create_date(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."


def test_recurring_reservations__create__general_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    data = get_minimal_create_date(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert RecurringReservation.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_recurring_reservations__create__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(admin)

    data = get_minimal_create_date(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert RecurringReservation.objects.filter(pk=response.first_query_object["pk"]).exists()
