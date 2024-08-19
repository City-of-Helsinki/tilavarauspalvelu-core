import pytest

from common.date_utils import next_hour
from tests.factories import RecurringReservationFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__update__regular_user(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")
    graphql.login_with_regular_user()

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_recurring_reservations__update__general_admin(graphql):
    begin = next_hour()
    recurring_reservation = RecurringReservationFactory.create(begin=begin, name="foo")

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"


def test_recurring_reservations__update__unit_admin(graphql):
    begin = next_hour()
    recurring_reservation = RecurringReservationFactory.create(begin=begin, name="foo")

    admin = UserFactory.create_with_unit_role(units=[recurring_reservation.reservation_unit.unit])
    graphql.force_login(admin)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"
