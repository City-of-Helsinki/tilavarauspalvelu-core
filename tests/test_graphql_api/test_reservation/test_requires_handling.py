from __future__ import annotations

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import AccessType, ReservationNotification, ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, UserFactory
from tests.helpers import patch_method

from .helpers import REQUIRE_HANDLING_MUTATION, get_require_handling_data

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CONFIRMED,
        ReservationStateChoice.DENIED,
    ],
)
@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_reservation__requires_handling__allowed_states(graphql, outbox, state):
    reservation = ReservationFactory.create_for_requires_handling(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_units.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 1
    assert outbox[0].subject == "Your booking is waiting for processing"

    assert PindoraClient.deactivate_reservation_access_code.call_count == 0


@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CREATED,
        ReservationStateChoice.CANCELLED,
        ReservationStateChoice.REQUIRES_HANDLING,
        ReservationStateChoice.WAITING_FOR_PAYMENT,
    ],
)
def test_reservation__requires_handling__disallowed_states(graphql, state):
    reservation = ReservationFactory.create_for_requires_handling(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_units.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be handled based on its state"]

    reservation.refresh_from_db()
    assert reservation.state == state


@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_reservation__requires_handling__pindora_api__call_succeeds(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.access_code_is_active is False

    assert PindoraClient.deactivate_reservation_access_code.call_count == 1


@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraAPIError("Pindora API error"))
def test_reservation__requires_handling__pindora_api__call_fails(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "Pindora API error"

    assert PindoraClient.deactivate_reservation_access_code.call_count == 1


@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraNotFoundError("Error"))
def test_reservation__requires_handling__pindora_api__call_fails__404(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    # Request is still successful if Pindora fails with 404
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.access_code_is_active is True

    assert PindoraClient.deactivate_reservation_access_code.call_count == 1


@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_reservation__requires_handling__pindora_api__not_called_if_not_generated(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.DENIED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.access_code_is_active is False

    assert PindoraClient.deactivate_reservation_access_code.call_count == 0
