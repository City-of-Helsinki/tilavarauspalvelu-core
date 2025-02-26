from __future__ import annotations

import pytest
import requests
from graphene_django_extensions.testing import parametrize_helper
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_418_IM_A_TEAPOT,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import (
    PindoraAPIError,
    PindoraBadRequestError,
    PindoraClientError,
    PindoraConflictError,
    PindoraNotFoundError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import RecurringReservationFactory, ReservationFactory
from tests.helpers import ResponseMock, exact, patch_method, use_retries

from .helpers import ErrorParams, default_access_code_modify_response, default_reservation_series_response


def test_pindora_client__get_reservation_series():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.get_reservation_series(series)

    assert response["reservation_unit_id"] == reservation.ext_uuid
    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is True

    assert response["reservation_unit_code_validity"] == [
        {
            "access_code_valid_minutes_before": 0,
            "access_code_valid_minutes_after": 0,
            "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE),
            "end": reservation.end.astimezone(DEFAULT_TIMEZONE),
        }
    ]


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
def test_pindora_client__get_reservation_series__errors(status_code, exception, error_msg):
    series = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__missing_key():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)
    data.pop("reservation_unit_id")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Missing key in reservation series response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__invalid_data():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)
    data["reservation_unit_id"] = str(reservation.id)

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Invalid value in reservation series response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


@use_retries(attempts=3)
def test_pindora_client__get_reservation_series__fails_all_retries():
    series = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, side_effect=requests.ConnectionError("timeout"))

    with patch as magic_mock, pytest.raises(requests.ConnectionError):
        PindoraClient.get_reservation_series(series)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_reservation_series__retry_on_500():
    series = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR))

    with patch as magic_mock, pytest.raises(ExternalServiceRequestError):
        PindoraClient.get_reservation_series(series)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_reservation_series__succeeds_after_retry():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)

    patch = patch_method(
        PindoraClient.request,
        side_effect=[
            requests.ConnectionError("timeout"),
            ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR),
            ResponseMock(json_data=data),
        ],
    )

    with patch as magic_mock:
        PindoraClient.get_reservation_series(series)

    assert magic_mock.call_count == 3


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_reservation_series(is_active: bool):
    series = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=series,
        created_at=local_datetime(),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_reservation_series_response(reservation, access_code_is_active=is_active)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.create_reservation_series(series, is_active=is_active)

    assert response["reservation_unit_id"] == reservation.ext_uuid
    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is is_active

    assert response["reservation_unit_code_validity"] == [
        {
            "access_code_valid_minutes_before": 0,
            "access_code_valid_minutes_after": 0,
            "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE),
            "end": reservation.end.astimezone(DEFAULT_TIMEZONE),
        }
    ]


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
        "409": ErrorParams(
            status_code=HTTP_409_CONFLICT,
            exception=PindoraConflictError,
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__errors(status_code, exception, error_msg):
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.create_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__create_reservation_series__no_reservations():
    series = RecurringReservationFactory.create()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No reservations require an access code in reservation series '{series.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.create_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__create_reservation_series__no_confirmed_reservations():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No reservations require an access code in reservation series '{series.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.create_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        PindoraClient.reschedule_reservation_series(series)

    assert patch.call_count == 1


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
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__errors(status_code, exception, error_msg):
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.reschedule_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__no_reservations():
    series = RecurringReservationFactory.create()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No confirmed reservations in reservation series '{series.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.reschedule_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__no_confirmed_reservations():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        recurring_reservation=series,
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No confirmed reservations in reservation series '{series.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.reschedule_reservation_series(series)


def test_pindora_client__delete_reservation_series():
    series = RecurringReservationFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.delete_reservation_series(series)

    assert patch.call_count == 1


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
def test_pindora_client__delete_reservation_series__errors(status_code, exception, error_msg):
    series = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.delete_reservation_series(series)


def test_pindora_client__change_reservation_series_access_code():
    series = RecurringReservationFactory.build()

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        PindoraClient.change_reservation_series_access_code(series)

    assert patch.call_count == 1


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
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__change_reservation_series_access_code__errors(status_code, exception, error_msg):
    seres = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.change_reservation_series_access_code(seres)


def test_pindora_client__activate_reservation_series_access_code():
    series = RecurringReservationFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.activate_reservation_series_access_code(series)

    assert patch.call_count == 1


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
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__activate_reservation_series_access_code__errors(status_code, exception, error_msg):
    series = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.activate_reservation_series_access_code(series)


def test_pindora_client__deactivate_reservation_series_access_code():
    series = RecurringReservationFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.deactivate_reservation_series_access_code(series)

    assert patch.call_count == 1


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
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__deactivate_reservation_series_access_code__errors(status_code, exception, error_msg):
    series = RecurringReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.deactivate_reservation_series_access_code(series)
