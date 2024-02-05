import pytest

from tests.factories import RecurringReservationFactory, ReservationUnitFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__update(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"


def test_recurring_reservations__update__end_time_before_begin_time(graphql):
    recurring_reservation = RecurringReservationFactory.create(
        begin_time="10:00:00",
        end_time="12:00:00",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "pk": recurring_reservation.pk,
        "endTime": "09:00:00",
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Begin time cannot be after end time."


def test_recurring_reservations__update__end_date_before_begin_date(graphql):
    recurring_reservation = RecurringReservationFactory.create(
        begin_date="2022-01-01",
        end_date="2022-01-02",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "pk": recurring_reservation.pk,
        "endDate": "2021-12-31",
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Begin date cannot be after end date."


def test_recurring_reservations__update__cannot_update_reservation_unit(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")
    old_reservation_unit = recurring_reservation.reservation_unit
    new_reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "pk": recurring_reservation.pk,
        "name": "bar",
        "reservationUnitPk": new_reservation_unit.pk,
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is True

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.reservation_unit == old_reservation_unit


def test_recurring_reservations__update__description_can_be_empty(graphql):
    recurring_reservation = RecurringReservationFactory.create(description="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "pk": recurring_reservation.pk,
        "description": "",
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.description == ""
