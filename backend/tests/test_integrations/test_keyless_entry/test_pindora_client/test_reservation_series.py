from __future__ import annotations

import uuid

import pytest
import requests
from freezegun import freeze_time
from graphene_django_extensions.testing import parametrize_helper
from rest_framework.status import (
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
    PindoraConflictError,
    PindoraNotFoundError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraAccessCodeModifyResponse,
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesResponse,
)
from utils.date_utils import local_datetime, local_iso_format
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import ReservationFactory, ReservationSeriesFactory
from tests.helpers import ResponseMock, exact, patch_method, use_retries
from tests.test_integrations.test_keyless_entry.helpers import (
    ErrorParams,
    default_access_code_modify_response,
    default_reservation_series_response,
)


def test_pindora_client__get_reservation_series(settings):
    series = ReservationSeriesFactory.build()

    data = default_reservation_series_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.get_reservation_series(series)

    assert response == PindoraReservationSeriesResponse(
        reservation_unit_id=uuid.UUID(data["reservation_unit_id"]),
        access_code="13245#",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 14),
            ),
        ],
    )

    assert patch.call_args.kwargs["method"] == "get"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/{series.ext_uuid}"


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when fetching reservation series '<uuid>': [418] error text",
        ),
    })
)
def test_pindora_client__get_reservation_series__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__missing_key():
    series = ReservationSeriesFactory.build()

    data = default_reservation_series_response()
    data.pop("reservation_unit_id")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Missing key in reservation series response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__invalid_data():
    series = ReservationSeriesFactory.build()

    data = default_reservation_series_response(reservation_unit_id="not-a-uuid")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Invalid value in reservation series response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


@use_retries(attempts=3)
def test_pindora_client__get_reservation_series__fails_all_retries():
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, side_effect=requests.ConnectionError("timeout"))

    with patch as magic_mock, pytest.raises(requests.ConnectionError):
        PindoraClient.get_reservation_series(series)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_reservation_series__retry_on_500():
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR))

    with patch as magic_mock, pytest.raises(ExternalServiceRequestError):
        PindoraClient.get_reservation_series(series)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_reservation_series__succeeds_after_retry():
    series = ReservationSeriesFactory.build()

    data = default_reservation_series_response()

    patch = patch_method(
        PindoraClient.request,
        side_effect=[
            requests.ConnectionError("timeout"),
            ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR),
            ResponseMock(json_data=data),
        ],
    )

    with patch as magic_mock:
        response = PindoraClient.get_reservation_series(series)

    assert response["access_code"] == "13245#"
    assert magic_mock.call_count == 3


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_reservation_series(settings, is_active: bool):
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_series=series,
        created_at=local_datetime(),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_reservation_series_response(access_code_is_active=is_active)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.create_reservation_series(series, is_active=is_active)

    assert response["access_code"] == "13245#"
    assert response["access_code_is_active"] is is_active

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series"
    assert patch.call_args.kwargs["json"] == {
        "reservation_series_id": str(series.ext_uuid),
        "reservation_unit_id": str(series.reservation_unit.ext_uuid),
        "series": [
            {
                "begin": local_iso_format(reservation.begins_at),
                "end": local_iso_format(reservation.ends_at),
            },
        ],
        "is_active": is_active,
    }


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "409": ErrorParams(
            status_code=HTTP_409_CONFLICT,
            exception=PindoraConflictError,
            error_msg="Reservation series '<uuid>' already exists in Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when creating reservation series '<uuid>': [418] error text",
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.create_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__create_reservation_series__no_reservations():
    series = ReservationSeriesFactory.create()

    data = default_reservation_series_response(reservation_unit_code_validity=[])

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.create_reservation_series(series)

    assert mock.call_args.kwargs["json"]["series"] == []


@pytest.mark.django_db
def test_pindora_client__create_reservation_series__no_confirmed_reservations():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_reservation_series_response(reservation_unit_code_validity=[])

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.create_reservation_series(series)

    assert mock.call_args.kwargs["json"]["series"] == []


@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series(settings):
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.reschedule_reservation_series(series)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    assert patch.call_args.kwargs["method"] == "put"
    assert (
        patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/reschedule/{series.ext_uuid}"
    )
    assert patch.call_args.kwargs["json"] == {
        "series": [
            {
                "begin": local_iso_format(reservation.begins_at),
                "end": local_iso_format(reservation.ends_at),
            },
        ],
    }


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when rescheduling reservation series '<uuid>': [418] error text"
            ),
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.reschedule_reservation_series(series)


@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__no_reservations():
    series = ReservationSeriesFactory.create()

    data = default_access_code_modify_response()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.reschedule_reservation_series(series)

    assert mock.call_args.kwargs["json"]["series"] == []


@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__no_confirmed_reservations():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_access_code_modify_response()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.reschedule_reservation_series(series)

    assert mock.call_args.kwargs["json"]["series"] == []


def test_pindora_client__delete_reservation_series(settings):
    series = ReservationSeriesFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.delete_reservation_series(series)

    assert patch.call_args.kwargs["method"] == "delete"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/{series.ext_uuid}"


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when deleting reservation series '<uuid>': [418] error text",
        ),
    })
)
def test_pindora_client__delete_reservation_series__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.delete_reservation_series(series)


def test_pindora_client__change_reservation_series_access_code(settings):
    series = ReservationSeriesFactory.build()

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.change_reservation_series_access_code(series)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    assert patch.call_args.kwargs["method"] == "put"
    assert (
        patch.call_args.kwargs["url"]
        == f"{settings.PINDORA_API_URL}/reservation-series/change-access-code/{series.ext_uuid}"
    )


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when changing access code for reservation series "
                "'<uuid>': [418] error text"
            ),
        ),
    })
)
def test_pindora_client__change_reservation_series_access_code__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.change_reservation_series_access_code(series)


def test_pindora_client__activate_reservation_series_access_code(settings):
    series = ReservationSeriesFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.activate_reservation_series_access_code(series)

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/activate/{series.ext_uuid}"


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when activating access code for reservation series "
                "'<uuid>': [418] error text"
            ),
        ),
    })
)
def test_pindora_client__activate_reservation_series_access_code__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.activate_reservation_series_access_code(series)


def test_pindora_client__deactivate_reservation_series_access_code(settings):
    series = ReservationSeriesFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.deactivate_reservation_series_access_code(series)

    assert patch.call_args.kwargs["method"] == "put"
    assert (
        patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/deactivate/{series.ext_uuid}"
    )


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
            error_msg="Invalid Pindora API request: error text.",
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
            error_msg="Pindora API key is invalid.",
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
            error_msg="Reservation series '<uuid>' not found from Pindora.",
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when deactivating access code for reservation series "
                "'<uuid>': [418] error text"
            ),
        ),
    })
)
def test_pindora_client__deactivate_reservation_series_access_code__errors(status_code, exception, error_msg):
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(series.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.deactivate_reservation_series_access_code(series)


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__get_reservation_series__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    series_data = PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_reservation_series_response(series_data, ext_uuid=series.ext_uuid)

    response = PindoraClient.get_reservation_series(series)

    assert response == series_data

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__get_reservation_series__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.get_reservation_series(series)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@patch_method(PindoraClient._mock_create_access_code, return_value="12345")
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    response = PindoraClient.create_reservation_series(series)

    assert response == PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__pindora_mock__already_exists(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    series_data = PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_reservation_series_response(series_data, ext_uuid=series.ext_uuid)

    with pytest.raises(PindoraConflictError):
        PindoraClient.create_reservation_series(series)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 10),
        ends_at=local_datetime(2024, 1, 1, 11),
        created_at=local_datetime(),
        reservation_series=series,
    )

    PindoraClient.create_reservation_series(series)

    reservation.begins_at = local_datetime(2024, 1, 1, 12)
    reservation.ends_at = local_datetime(2024, 1, 1, 13)
    reservation.save()

    response = PindoraClient.reschedule_reservation_series(series)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    series_response = PindoraClient.get_reservation_series(series)

    assert series_response["reservation_unit_code_validity"] == [
        PindoraReservationSeriesAccessCodeValidity(
            access_code_valid_minutes_before=0,
            access_code_valid_minutes_after=0,
            begin=local_datetime(2024, 1, 1, 12),
            end=local_datetime(2024, 1, 1, 13),
        )
    ]

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation_series__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    msg = f"Reservation series '{series.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraNotFoundError, match=exact(msg)):
        PindoraClient.reschedule_reservation_series(series)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@patch_method(PindoraClient._mock_create_access_code, return_value="54321")
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__change_reservation_series_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    series_data = PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(2024, 1, 1, 10),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_reservation_series_response(series_data, ext_uuid=series.ext_uuid)

    response = PindoraClient.change_reservation_series_access_code(series)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_reservation_series_response(ext_uuid=series.ext_uuid)

    assert cached_response["access_code"] == "54321"
    assert cached_response["access_code_generated_at"] == local_datetime()

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__change_reservation_series_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.change_reservation_series_access_code(series)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__activate_reservation_series_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    series_data = PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_reservation_series_response(series_data, ext_uuid=series.ext_uuid)

    PindoraClient.activate_reservation_series_access_code(series)

    cached_response = PindoraClient._get_cached_reservation_series_response(ext_uuid=series.ext_uuid)

    assert cached_response["access_code_is_active"] is True

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__activate_reservation_series_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.activate_reservation_series_access_code(series)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__deactivate_reservation_series_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    series_data = PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_reservation_series_response(series_data, ext_uuid=series.ext_uuid)

    PindoraClient.deactivate_reservation_series_access_code(series)

    cached_response = PindoraClient._get_cached_reservation_series_response(ext_uuid=series.ext_uuid)

    assert cached_response["access_code_is_active"] is False

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__deactivate_reservation_series_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.deactivate_reservation_series_access_code(series)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__delete_reservation_series__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    series_data = PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_reservation_series_response(series_data, ext_uuid=series.ext_uuid)

    PindoraClient.delete_reservation_series(series)

    cached_response = PindoraClient._get_cached_reservation_series_response(ext_uuid=series.ext_uuid)

    assert cached_response is None

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__delete_reservation_series__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series=series,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.delete_reservation_series(series)

    assert PindoraClient.request.call_count == 0
