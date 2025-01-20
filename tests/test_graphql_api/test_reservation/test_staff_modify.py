from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from utils.date_utils import next_hour

from tests.factories import ReservationFactory

from .helpers import UPDATE_STAFF_MUTATION, get_staff_modify_data

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__staff_modify(graphql):
    reservation = ReservationFactory.create_for_staff_update()

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.name == "foo"


def test_reservation__staff_modify__normal_reservation_to_staff(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.NORMAL)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.STAFF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["A normal type reservation cannot be changed to any other type."]


def test_reservation__staff_modify__normal_reservation_to_behalf(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.NORMAL)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BEHALF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["A normal type reservation cannot be changed to any other type."]


def test_reservation__staff_modify__normal_reservation_to_blocked(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.NORMAL)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BLOCKED)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["A normal type reservation cannot be changed to any other type."]


def test_reservation__staff_modify__staff_reservation_to_normal(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.STAFF)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.NORMAL)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "A reservation cannot be changed to a normal reservation from any other type.",
    ]


def test_reservation__staff_modify__behalf_reservation_to_normal(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.BEHALF)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.NORMAL)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "A reservation cannot be changed to a normal reservation from any other type.",
    ]


def test_reservation__staff_modify__blocked_reservation_to_normal(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.BLOCKED)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.NORMAL)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "A reservation cannot be changed to a normal reservation from any other type.",
    ]


def test_reservation__staff_modify__wrong_state(graphql):
    reservation = ReservationFactory.create_for_staff_update(state=ReservationStateChoice.CANCELLED)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be edited by staff members based on its state"]


def test_reservation__staff_modify__end_date_passed(graphql):
    end = next_hour(plus_hours=-1, plus_days=-1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_staff_update(begin=begin, end=end)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be changed anymore."]
