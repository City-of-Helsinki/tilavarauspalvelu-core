from __future__ import annotations

import pytest
import requests
from graphene_django_extensions.testing import parametrize_helper
from rest_framework.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_418_IM_A_TEAPOT,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import (
    PindoraAPIError,
    PindoraBadRequestError,
    PindoraClientConfigurationError,
    PindoraNotFoundError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import ReservationUnitFactory
from tests.helpers import ResponseMock, exact, patch_method, use_retires

from .helpers import ErrorParams, default_reservation_unit_response


def test_pindora_client__get_reservation_unit():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.get_reservation_unit(reservation_unit)

    assert response["reservation_unit_id"] == reservation_unit.uuid
    assert response["name"] == reservation_unit.name
    assert response["keypad_url"] == "https://example.com"


def test_pindora_client__get_reservation_unit__missing_api_key(settings):
    settings.PINDORA_API_KEY = ""

    reservation_unit = ReservationUnitFactory.build()

    msg = "'PINDORA_API_KEY' setting must to be configured for Pindora client to work."
    with pytest.raises(PindoraClientConfigurationError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__missing_api_url(settings):
    settings.PINDORA_API_URL = ""

    reservation_unit = ReservationUnitFactory.build()

    msg = "'PINDORA_API_URL' setting must to be configured for Pindora client to work."
    with pytest.raises(PindoraClientConfigurationError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


@use_retires(attempts=3)
def test_pindora_client__get_reservation_unit__fails_all_retries():
    reservation_unit = ReservationUnitFactory.build()

    patch = patch_method(PindoraClient.request, side_effect=requests.ConnectionError("timeout"))

    with patch as magic_mock, pytest.raises(requests.ConnectionError):
        PindoraClient.get_reservation_unit(reservation_unit)

    assert magic_mock.call_count == 3


@use_retires(attempts=3)
def test_pindora_client__get_reservation_unit__retry_on_500():
    reservation_unit = ReservationUnitFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR))

    with patch as magic_mock, pytest.raises(ExternalServiceRequestError):
        PindoraClient.get_reservation_unit(reservation_unit)

    assert magic_mock.call_count == 3


@use_retires(attempts=3)
def test_pindora_client__get_reservation_unit__succeeds_after_retry():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)

    patch = patch_method(
        PindoraClient.request,
        side_effect=[
            requests.ConnectionError("timeout"),
            ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR),
            ResponseMock(json_data=data),
        ],
    )

    with patch as magic_mock:
        PindoraClient.get_reservation_unit(reservation_unit)

    assert magic_mock.call_count == 3


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__get_reservation_unit__errors(status_code, exception, error_msg):
    reservation_unit = ReservationUnitFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__missing_key():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)
    data.pop("reservation_unit_id")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Missing key in reservation unit response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)


def test_pindora_client__get_reservation_unit__invalid_data():
    reservation_unit = ReservationUnitFactory.build()

    data = default_reservation_unit_response(reservation_unit)
    data["reservation_unit_id"] = str(reservation_unit.id)

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Invalid value in reservation unit response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_unit(reservation_unit)
