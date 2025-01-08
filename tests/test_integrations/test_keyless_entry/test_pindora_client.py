from __future__ import annotations

import pytest
from rest_framework.status import (
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_418_IM_A_TEAPOT,
)

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIConfigurationError, PindoraAPIError
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from tests.factories import ReservationFactory, ReservationUnitFactory
from tests.helpers import ResponseMock, exact, patch_method

from .helpers import default_reservation_response, default_reservation_unit_response


def test_pindora_client__get_reservation_unit():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.get_reservation_unit(reservation_unit)

    assert response["reservation_unit_id"] == reservation_unit.uuid
    assert response["name"] == reservation_unit.name
    assert response["keypad_url"] == "https://example.com"


def test_pindora_client__get_reservation_unit__missing_api_key(settings):
    settings.PINDORA_API_KEY = ""

    reservation_unit = ReservationUnitFactory.build()

    msg = "'PINDORA_API_KEY' environment variable must to be configured."
    with pytest.raises(PindoraAPIConfigurationError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__missing_api_url(settings):
    settings.PINDORA_API_URL = ""

    reservation_unit = ReservationUnitFactory.build()

    msg = "'PINDORA_API_URL' environment variable must to be configured."
    with pytest.raises(PindoraAPIConfigurationError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__get_reservation_unit__403():
    reservation_unit = ReservationUnitFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__get_reservation_unit__400():
    reservation_unit = ReservationUnitFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__get_reservation_unit__404():
    reservation_unit = ReservationUnitFactory.build()

    msg = f"Reservation unit '{reservation_unit.uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__get_reservation_unit__not_200():
    reservation_unit = ReservationUnitFactory.build()

    msg = (
        f"Unexpected response from Pindora when fetching reservation unit '{reservation_unit.uuid}': [418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__missing_key():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)
    data.pop("reservation_unit_id")

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    )

    msg = "Missing key in reservation unit response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__invalid_data():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)
    data["reservation_unit_id"] = str(reservation_unit.id)

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    )

    msg = "Invalid value in reservation unit response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


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
    assert response["begin"] == reservation.begin.astimezone(DEFAULT_TIMEZONE)
    assert response["end"] == reservation.end.astimezone(DEFAULT_TIMEZONE)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__get_reservation__403():
    reservation = ReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__get_reservation__400():
    reservation = ReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
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
    with pytest.raises(PindoraAPIError, match=exact(msg)):
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


@pytest.mark.django_db
def test_pindora_client__create_reservation():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    data = default_reservation_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.create_reservation(reservation)

    assert response["reservation_unit_id"] == reservation.ext_uuid
    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_valid_minutes_before"] == 0
    assert response["access_code_valid_minutes_after"] == 0
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
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
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation__400():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@pytest.mark.django_db
def test_pindora_client__create_reservation__not_200():
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_units__name="foo")

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
    )

    msg = f"Unexpected response from Pindora when creating reservation '{reservation.ext_uuid}': [418] I'm a teapot"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
def test_pindora_client__update_reservation():
    reservation = ReservationFactory.build()

    PindoraClient.update_reservation_time(reservation)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__update_reservation__403():
    reservation = ReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_time(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__update_reservation__400():
    reservation = ReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_time(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__update_reservation__404():
    reservation = ReservationFactory.build()

    msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_time(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__update_reservation__not_204():
    reservation = ReservationFactory.build()

    msg = (
        f"Unexpected response from Pindora when modifying time for reservation '{reservation.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_time(reservation)


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
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__delete_reservation__400():
    reservation = ReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
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
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__delete_reservation__non_204():
    reservation = ReservationFactory.build()

    msg = f"Unexpected response from Pindora when deleting reservation '{reservation.ext_uuid}': [418] I'm a teapot"
    with pytest.raises(PindoraAPIError, match=exact(msg)):
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
    assert response["begin"] == reservation.begin.astimezone(DEFAULT_TIMEZONE)
    assert response["end"] == reservation.end.astimezone(DEFAULT_TIMEZONE)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__change_reservation_access_code__403():
    reservation = ReservationFactory.build(created_at=local_datetime())

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__change_reservation_access_code__400():
    reservation = ReservationFactory.build(created_at=local_datetime())

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
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
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)
