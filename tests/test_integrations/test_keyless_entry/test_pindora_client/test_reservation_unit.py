from __future__ import annotations

import pytest
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND, HTTP_418_IM_A_TEAPOT

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIConfigurationError, PindoraAPIError
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from tests.factories import ReservationUnitFactory
from tests.helpers import ResponseMock, exact, patch_method
from tests.test_integrations.test_keyless_entry.helpers import default_reservation_unit_response


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

    msg = "'PINDORA_API_KEY' setting must to be configured for Pindora client to work."
    with pytest.raises(PindoraAPIConfigurationError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__missing_api_url(settings):
    settings.PINDORA_API_URL = ""

    reservation_unit = ReservationUnitFactory.build()

    msg = "'PINDORA_API_URL' setting must to be configured for Pindora client to work."
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
