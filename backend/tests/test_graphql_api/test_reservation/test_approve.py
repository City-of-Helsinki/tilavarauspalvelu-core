from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationUnitFactory
from tests.helpers import patch_method

from .helpers import APPROVE_MUTATION, get_approve_data

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.activate_access_code)
def test_reservation__approve__succeeds(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert PindoraService.activate_access_code.call_count == 0


def test_reservation__approve__cant_approve_if_status_not_requires_handling(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CREATED,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be approved based on its state"]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__approve__approving_fails_when_price_missing(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("price")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__approve__fails_when_handling_details_missing(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("handlingDetails")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__approve__succeeds_with_empty_handling_details(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    data["handlingDetails"] = ""
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.create_access_code)
def test_reservation__approve__succeeds__pindora_api__call_succeeds(graphql):
    reservation = ReservationFactory.create(
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.REQUIRES_HANDLING,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.activate_access_code, side_effect=PindoraAPIError("Error"))
@patch_method(PindoraService.create_access_code)
def test_reservation__approve__succeeds__pindora_api__call_fails(graphql):
    reservation = ReservationFactory.create(
        reservation_units__access_types__access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.REQUIRES_HANDLING,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    # Request is still successful, even if Pindora API call fails
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    assert reservation.access_code_is_active is False

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.create_access_code.called is False
