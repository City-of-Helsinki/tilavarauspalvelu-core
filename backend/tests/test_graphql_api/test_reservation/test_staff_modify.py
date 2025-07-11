from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime, next_hour

from tests.factories import ReservationFactory
from tests.helpers import patch_method

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


def test_reservation__staff_modify__wrong_state(graphql):
    reservation = ReservationFactory.create_for_staff_update(state=ReservationStateChoice.CANCELLED)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be edited by staff members based on its state"]


def test_reservation__staff_modify__end_date_passed(graphql):
    end = next_hour(plus_hours=-1, plus_days=-2)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_staff_update(begins_at=begin, ends_at=end)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be changed anymore."]


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


@patch_method(PindoraService.activate_access_code)
def test_reservation__staff_modify__blocked_reservation_to_staff(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.BLOCKED)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.STAFF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.type == ReservationTypeChoice.STAFF

    assert PindoraService.activate_access_code.call_count == 0


@patch_method(PindoraService.activate_access_code)
def test_reservation__staff_modify__blocked_reservation_to_staff__pindora_api__call_succeeds(graphql):
    reservation = ReservationFactory.create_for_staff_update(
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.STAFF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.type == ReservationTypeChoice.STAFF

    assert PindoraService.activate_access_code.call_count == 1


@patch_method(PindoraService.activate_access_code, side_effect=PindoraAPIError("Pindora API error"))
@patch_method(SentryLogger.log_exception)
def test_reservation__staff_modify__blocked_reservation_to_staff__pindora_api__call_fails(graphql):
    reservation = ReservationFactory.create_for_staff_update(
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.STAFF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    # Mutation didn't fail even if Pindora call failed.
    # Access code will be activated later in a background task.
    assert response.has_errors is False, response.errors

    assert PindoraService.activate_access_code.call_count == 1

    assert SentryLogger.log_exception.called is True


@patch_method(PindoraService.activate_access_code, side_effect=PindoraNotFoundError("Error"))
def test_reservation__staff_modify__blocked_reservation_to_staff__pindora_api__call_fails__404(graphql):
    reservation = ReservationFactory.create_for_staff_update(
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.STAFF)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    # Request is still successful if Pindora fails with 404
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.type == ReservationTypeChoice.STAFF
    assert reservation.access_code_is_active is False

    assert PindoraService.activate_access_code.call_count == 1


@patch_method(PindoraService.deactivate_access_code)
def test_reservation__staff_modify__staff_reservation_to_blocked(graphql):
    reservation = ReservationFactory.create_for_staff_update(type=ReservationTypeChoice.STAFF)

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BLOCKED)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.type == ReservationTypeChoice.BLOCKED
    assert reservation.access_code_is_active is False

    assert PindoraService.deactivate_access_code.call_count == 0


@patch_method(PindoraService.deactivate_access_code)
def test_reservation__staff_modify__staff_reservation_to_blocked__pindora_api__call_succeeds(graphql):
    reservation = ReservationFactory.create_for_staff_update(
        type=ReservationTypeChoice.STAFF,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BLOCKED)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.type == ReservationTypeChoice.BLOCKED

    assert PindoraService.deactivate_access_code.call_count == 1


@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraAPIError("Pindora API error"))
@patch_method(SentryLogger.log_exception)
def test_reservation__staff_modify__staff_reservation_to_blocked__pindora_api__call_fails(graphql):
    reservation = ReservationFactory.create_for_staff_update(
        type=ReservationTypeChoice.STAFF,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BLOCKED)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    # Mutation didn't fail even if Pindora call failed.
    # Access code will be deactivated later in a background task.
    assert response.has_errors is False, response.errors

    assert PindoraService.deactivate_access_code.call_count == 1

    assert SentryLogger.log_exception.called is True


@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraNotFoundError("Error"))
def test_reservation__staff_modify__staff_reservation_to_blocked__pindora_api__call_succeeds__404(graphql):
    reservation = ReservationFactory.create_for_staff_update(
        type=ReservationTypeChoice.STAFF,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_staff_modify_data(reservation, type=ReservationTypeChoice.BLOCKED)
    response = graphql(UPDATE_STAFF_MUTATION, input_data=data)

    # Request is still successful if Pindora fails with 404
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.type == ReservationTypeChoice.BLOCKED
    assert reservation.access_code_is_active is True

    assert PindoraService.deactivate_access_code.call_count == 1
