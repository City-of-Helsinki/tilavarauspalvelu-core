import datetime

import pytest

from tests.factories import ReservationFactory
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from utils.date_utils import next_hour

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

    assert response.error_message() == "Reservation type cannot be changed from NORMAL to STAFF."


def test_reservation__staff_modify__normal_reservation_to_behalf(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.NORMAL)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BEHALF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation type cannot be changed from NORMAL to BEHALF."


def test_reservation__staff_modify__normal_reservation_to_blocked(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.NORMAL)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BLOCKED)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation type cannot be changed from NORMAL to BLOCKED."


def test_reservation__staff_modify__staff_reservation_to_normal(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.STAFF)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.NORMAL)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation type cannot be changed to NORMAl from state STAFF."


def test_reservation__staff_modify__behalf_reservation_to_normal(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.BEHALF)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.NORMAL)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation type cannot be changed to NORMAl from state BEHALF."


def test_reservation__staff_modify__blocked_reservation_to_normal(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.BLOCKED)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.NORMAL)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation type cannot be changed to NORMAl from state BLOCKED."


def test_reservation__staff_modify__wrong_state(graphql):
    reservation = ReservationFactory.create_for_staff_update(state=ReservationStateChoice.CANCELLED)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation must be in confirmed state."


def test_reservation__staff_modify__end_date_passed(graphql):
    end = next_hour(plus_hours=-1, plus_days=-1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_staff_update(begin=begin, end=end)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation cannot be changed anymore."
