from __future__ import annotations

import pytest
import requests
from freezegun import freeze_time
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
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import ReservationFactory, ReservationSeriesFactory
from tests.helpers import ResponseMock, exact, parametrize_helper, patch_method, use_retries
from tests.test_integrations.test_keyless_entry.helpers import (
    ErrorParams,
    default_access_code_modify_response,
    default_reservation_series_response,
)


def test_pindora_client__get_reservation_series():
    series = ReservationSeriesFactory.build()
    ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.get_reservation_series(series)

    assert response["access_code"] == "13245#"


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
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__missing_key():
    series = ReservationSeriesFactory.build()
    ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response()
    data.pop("reservation_unit_id")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Missing key in reservation series response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__invalid_data():
    series = ReservationSeriesFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response()
    data["reservation_unit_id"] = str(reservation.id)

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
    ReservationFactory.build(created_at=local_datetime())

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
        PindoraClient.get_reservation_series(series)

    assert magic_mock.call_count == 3


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_reservation_series(is_active: bool):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        created_at=local_datetime(),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_reservation_series_response(access_code_is_active=is_active)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.create_reservation_series(series, is_active=is_active)

    assert response["access_code"] == "13245#"


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
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
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
def test_pindora_client__reschedule_reservation_series():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
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
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_series=series,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
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


def test_pindora_client__delete_reservation_series():
    series = ReservationSeriesFactory.build()

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
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.delete_reservation_series(series)


def test_pindora_client__change_reservation_series_access_code():
    series = ReservationSeriesFactory.build()

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
    seres = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.change_reservation_series_access_code(seres)


def test_pindora_client__activate_reservation_series_access_code():
    series = ReservationSeriesFactory.build()

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
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.activate_reservation_series_access_code(series)


def test_pindora_client__deactivate_reservation_series_access_code():
    series = ReservationSeriesFactory.build()

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
    series = ReservationSeriesFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
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

    response = PindoraClient.change_reservation_series_access_code(series)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_reservation_series_response(ext_uuid=series.ext_uuid)

    assert cached_response["access_code"] == "54321"

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
