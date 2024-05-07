import datetime

import pytest

from tests.factories import RecurringReservationFactory, ReservationUnitFactory
from tests.helpers import UserType, next_hour

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__update(graphql):
    begin = next_hour()
    recurring_reservation = RecurringReservationFactory.create(begin=begin, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"


def test_recurring_reservations__update__end_time_before_begin_time(graphql):
    begin = next_hour(plus_hours=1)
    end = begin - datetime.timedelta(hours=1)

    recurring_reservation = RecurringReservationFactory.create(begin=begin, end=end)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    new_end = begin - datetime.timedelta(hours=1)
    data = {"pk": recurring_reservation.pk, "endTime": new_end.time().isoformat(timespec="seconds")}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin time cannot be after end time if on the same day."]


def test_recurring_reservations__update__end_time_same_as_begin_time(graphql):
    begin = next_hour(plus_hours=1)
    end = begin - datetime.timedelta(hours=1)

    recurring_reservation = RecurringReservationFactory.create(begin=begin, end=end)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": recurring_reservation.pk, "endTime": begin.time().isoformat(timespec="seconds")}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin time cannot be after end time if on the same day."]


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

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin date cannot be after end date."]


def test_recurring_reservations__update__cannot_update_reservation_unit(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")
    old_reservation_unit = recurring_reservation.reservation_unit
    new_reservation_unit = ReservationUnitFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "pk": recurring_reservation.pk,
        "name": "bar",
        "reservationUnit": new_reservation_unit.pk,
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is True

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.reservation_unit == old_reservation_unit


def test_recurring_reservations__update__description_can_be_empty(graphql):
    begin = next_hour()
    recurring_reservation = RecurringReservationFactory.create(begin=begin, description="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {
        "pk": recurring_reservation.pk,
        "description": "",
    }

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.description == ""
