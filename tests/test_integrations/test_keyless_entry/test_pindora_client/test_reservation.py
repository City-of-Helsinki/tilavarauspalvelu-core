from __future__ import annotations

from unittest import mock

import pytest
import requests
from rest_framework.status import (
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_418_IM_A_TEAPOT,
)

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import (
    PindoraAPIError,
    PindoraBadRequestError,
    PindoraConflictError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from tests.factories import ReservationFactory
from tests.helpers import ResponseMock, exact, patch_method, use_retires
from tests.test_integrations.test_keyless_entry.helpers import default_reservation_response


def test_pindora_client__get_reservation():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.get_reservation(reservation)

    assert response["reservation_unit_id"] == reservation.ext_uuid
    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_valid_minutes_before"] == 0
    assert response["access_code_valid_minutes_after"] == 0
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is True
    assert response["begin"] == reservation.begin.astimezone(DEFAULT_TIMEZONE)
    assert response["end"] == reservation.end.astimezone(DEFAULT_TIMEZONE)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__get_reservation__403():
    reservation = ReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraPermissionError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__get_reservation__400():
    reservation = ReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraBadRequestError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__get_reservation__404():
    reservation = ReservationFactory.build()

    msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__get_reservation__not_200():
    reservation = ReservationFactory.build()
    msg = f"Unexpected response from Pindora when fetching reservation '{reservation.ext_uuid}': [418] I'm a teapot"
    with pytest.raises(PindoraUnexpectedResponseError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


def test_pindora_client__get_reservation__missing_key():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response(reservation)
    data.pop("reservation_unit_id")

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    )

    msg = "Missing key in reservation response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


def test_pindora_client__get_reservation__invalid_data():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response(reservation)
    data["reservation_unit_id"] = str(reservation.id)

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    )

    msg = "Invalid value in reservation response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


@use_retires(attempts=3)
def test_pindora_client__get_reservation__retry__fails_all_retries():
    reservation = ReservationFactory.build(created_at=local_datetime())

    patch = mock.patch(
        "utils.external_service.base_external_service_client.request",
        side_effect=requests.ConnectionError("timeout"),
    )

    with patch as magic_mock, pytest.raises(requests.ConnectionError):
        PindoraClient.get_reservation(reservation)

    assert magic_mock.call_count == 3


@use_retires(attempts=3)
def test_pindora_client__get_reservation__retry__succeeds_after_retry():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response(reservation)

    patch = mock.patch(
        "utils.external_service.base_external_service_client.request",
        side_effect=[requests.ConnectionError("timeout"), ResponseMock(json_data=data)],
    )

    with patch as magic_mock:
        PindoraClient.get_reservation(reservation)

    assert magic_mock.call_count == 2


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_reservation(is_active):
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    data = default_reservation_response(reservation)
    data["access_code_is_active"] = is_active

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.create_reservation(reservation, is_active=is_active)

    assert response["reservation_unit_id"] == reservation.ext_uuid
    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_valid_minutes_before"] == 0
    assert response["access_code_valid_minutes_after"] == 0
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is is_active
    assert response["begin"] == reservation.begin.astimezone(DEFAULT_TIMEZONE)
    assert response["end"] == reservation.end.astimezone(DEFAULT_TIMEZONE)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation__403():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraPermissionError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation__400():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraBadRequestError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation__409():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    msg = f"Reservation '{reservation.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraConflictError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation__not_200():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    msg = f"Unexpected response from Pindora when creating reservation '{reservation.ext_uuid}': [418] I'm a teapot"
    with pytest.raises(PindoraUnexpectedResponseError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__update_reservation(is_active):
    reservation = ReservationFactory.build()

    PindoraClient.update_reservation(reservation, is_active=is_active)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__update_reservation__403():
    reservation = ReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraPermissionError, match=exact(msg)):
        PindoraClient.update_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__update_reservation__400():
    reservation = ReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraBadRequestError, match=exact(msg)):
        PindoraClient.update_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__update_reservation__404():
    reservation = ReservationFactory.build()

    msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
def test_pindora_client__update_reservation__409():
    reservation = ReservationFactory.build()

    msg = f"Reservation '{reservation.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraConflictError, match=exact(msg)):
        PindoraClient.update_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__update_reservation__not_204():
    reservation = ReservationFactory.build()

    msg = f"Unexpected response from Pindora when updating reservation '{reservation.ext_uuid}': [418] I'm a teapot"
    with pytest.raises(PindoraUnexpectedResponseError, match=exact(msg)):
        PindoraClient.update_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
def test_pindora_client__delete_reservation():
    reservation = ReservationFactory.build()

    PindoraClient.delete_reservation(reservation)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__delete_reservation__403():
    reservation = ReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraPermissionError, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__delete_reservation__400():
    reservation = ReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraBadRequestError, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__delete_reservation__404():
    reservation = ReservationFactory.build()

    msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
def test_pindora_client__delete_reservation__409():
    reservation = ReservationFactory.build()

    msg = f"Reservation '{reservation.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraConflictError, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__delete_reservation__non_204():
    reservation = ReservationFactory.build()

    msg = f"Unexpected response from Pindora when deleting reservation '{reservation.ext_uuid}': [418] I'm a teapot"
    with pytest.raises(PindoraUnexpectedResponseError, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


def test_pindora_client__change_reservation_access_code():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.change_reservation_access_code(reservation)

    assert response["reservation_unit_id"] == reservation.ext_uuid
    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_valid_minutes_before"] == 0
    assert response["access_code_valid_minutes_after"] == 0
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is True
    assert response["begin"] == reservation.begin.astimezone(DEFAULT_TIMEZONE)
    assert response["end"] == reservation.end.astimezone(DEFAULT_TIMEZONE)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__change_reservation_access_code__403():
    reservation = ReservationFactory.build(created_at=local_datetime())

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraPermissionError, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__change_reservation_access_code__400():
    reservation = ReservationFactory.build(created_at=local_datetime())

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraBadRequestError, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__change_reservation_access_code__404():
    reservation = ReservationFactory.build(created_at=local_datetime())

    msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__change_reservation_access_code__not_200():
    reservation = ReservationFactory.build(created_at=local_datetime())

    msg = (
        f"Unexpected response from Pindora when changing access code for reservation '{reservation.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraUnexpectedResponseError, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)
