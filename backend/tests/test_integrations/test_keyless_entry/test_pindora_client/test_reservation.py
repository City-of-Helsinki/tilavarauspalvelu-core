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
    PindoraReservationResponse,
)
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, local_iso_format
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import ReservationFactory
from tests.helpers import ResponseMock, exact, patch_method, use_retries
from tests.test_integrations.test_keyless_entry.helpers import (
    ErrorParams,
    default_access_code_modify_response,
    default_reservation_response,
)


def test_pindora_client__get_reservation(settings):
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.get_reservation(reservation)

    assert response == PindoraReservationResponse(
        reservation_unit_id=uuid.UUID(data["reservation_unit_id"]),
        access_code="13245#",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 14),
    )

    assert patch.call_args.kwargs["method"] == "get"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation/{reservation.ext_uuid}"


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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when fetching reservation '<uuid>': [418] error text",
        ),
    })
)
def test_pindora_client__get_reservation__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


def test_pindora_client__get_reservation__missing_key():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response()
    data.pop("reservation_unit_id")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Missing key in reservation response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


def test_pindora_client__get_reservation__invalid_data():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response(reservation_unit_id="not-a-uuid")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Invalid value in reservation response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation(reservation)


@use_retries(attempts=3)
def test_pindora_client__get_reservation__retry__fails_all_retries():
    reservation = ReservationFactory.build(created_at=local_datetime())

    patch = patch_method(PindoraClient.request, side_effect=requests.ConnectionError("timeout"))

    with patch as magic_mock, pytest.raises(requests.ConnectionError):
        PindoraClient.get_reservation(reservation)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_reservation__retry__retry_on_500():
    reservation = ReservationFactory.build(created_at=local_datetime())

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR))

    with patch as magic_mock, pytest.raises(ExternalServiceRequestError):
        PindoraClient.get_reservation(reservation)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_reservation__retry__succeeds_after_retry():
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_response()

    patch = patch_method(
        PindoraClient.request,
        side_effect=[
            requests.ConnectionError("timeout"),
            ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR),
            ResponseMock(json_data=data),
        ],
    )

    with patch as magic_mock:
        response = PindoraClient.get_reservation(reservation)

    assert response["access_code"] == "13245#"
    assert magic_mock.call_count == 3


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_reservation(settings, is_active):
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_unit__name="foo")

    data = default_reservation_response(access_code_is_active=is_active)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.create_reservation(reservation, is_active=is_active)

    assert response["access_code"] == "13245#"
    assert response["access_code_is_active"] is is_active

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation"
    assert patch.call_args.kwargs["json"] == {
        "reservation_id": str(reservation.ext_uuid),
        "reservation_unit_id": str(reservation.reservation_unit.ext_uuid),
        "begin": local_iso_format(reservation.begins_at),
        "end": local_iso_format(reservation.ends_at),
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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "409": ErrorParams(
            status_code=HTTP_409_CONFLICT,
            exception=PindoraConflictError,
            error_msg="Reservation '<uuid>' already exists in Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when creating reservation '<uuid>': [418] error text",
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__create_reservation__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.create(created_at=local_datetime(), reservation_unit__name="foo")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.create_reservation(reservation)


def test_pindora_client__reschedule_reservation(settings):
    reservation = ReservationFactory.build()

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.reschedule_reservation(reservation)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["json"] == {
        "begin": local_iso_format(reservation.begins_at),
        "end": local_iso_format(reservation.ends_at),
    }
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation/reschedule/{reservation.ext_uuid}"


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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when rescheduling reservation '<uuid>': [418] error text",
        ),
    })
)
def test_pindora_client__reschedule_reservation__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.reschedule_reservation(reservation)


def test_pindora_client__reschedule_reservation__missing_key():
    reservation = ReservationFactory.build()

    data = default_access_code_modify_response()
    data.pop("access_code_generated_at")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Missing key in reservation response from Pindora: 'access_code_generated_at'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.reschedule_reservation(reservation)


def test_pindora_client__reschedule_reservation__invalid_data():
    reservation = ReservationFactory.build()

    data = default_access_code_modify_response(access_code_generated_at="not-a-date")

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    msg = "Invalid value in reservation response from Pindora: Invalid isoformat string: 'not-a-date'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.reschedule_reservation(reservation)


def test_pindora_client__delete_reservation(settings):
    reservation = ReservationFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.delete_reservation(reservation)

    assert patch.call_args.kwargs["method"] == "delete"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation/{reservation.ext_uuid}"


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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg="Unexpected response from Pindora when deleting reservation '<uuid>': [418] error text",
        ),
    })
)
def test_pindora_client__delete_reservation__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.delete_reservation(reservation)


def test_pindora_client__change_reservation_access_code(settings):
    reservation = ReservationFactory.build()

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraClient.change_reservation_access_code(reservation)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    assert patch.call_args.kwargs["method"] == "put"
    assert (
        patch.call_args.kwargs["url"]
        == f"{settings.PINDORA_API_URL}/reservation/change-access-code/{reservation.ext_uuid}"
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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when changing access code for reservation '<uuid>': [418] error text"
            ),
        ),
    })
)
def test_pindora_client__change_reservation_access_code__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.change_reservation_access_code(reservation)


def test_pindora_client__activate_reservation_access_code(settings):
    reservation = ReservationFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.activate_reservation_access_code(reservation)

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation/activate/{reservation.ext_uuid}"


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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when activating access code for reservation "
                "'<uuid>': [418] error text"
            ),
        ),
    })
)
def test_pindora_client__activate_reservation_access_code__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.activate_reservation_access_code(reservation)


def test_pindora_client__deactivate_reservation_access_code(settings):
    reservation = ReservationFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.deactivate_reservation_access_code(reservation)

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation/deactivate/{reservation.ext_uuid}"


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
            error_msg="Reservation '<uuid>' not found from Pindora.",
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
            error_msg=(
                "Unexpected response from Pindora when deactivating access code for reservation "
                "'<uuid>': [418] error text"
            ),
        ),
    })
)
def test_pindora_client__deactivate_reservation_access_code__errors(status_code, exception, error_msg):
    reservation = ReservationFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code, text="error text"))

    msg = error_msg.replace("<uuid>", str(reservation.ext_uuid))
    with patch, pytest.raises(exception, match=exact(msg)):
        PindoraClient.deactivate_reservation_access_code(reservation)


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__get_reservation__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(created_at=local_datetime())

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(),
        access_code_is_active=reservation.access_code_is_active,
        begin=reservation.begins_at.astimezone(DEFAULT_TIMEZONE),
        end=reservation.ends_at.astimezone(DEFAULT_TIMEZONE),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    response = PindoraClient.get_reservation(reservation)

    assert response == reservation_data

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__get_reservation__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.get_reservation(uuid.uuid4())

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@patch_method(PindoraClient._mock_create_access_code, return_value="12345")
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__create_reservation__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    response = PindoraClient.create_reservation(reservation)

    assert response == PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=reservation.begins_at.astimezone(DEFAULT_TIMEZONE),
        end=reservation.ends_at.astimezone(DEFAULT_TIMEZONE),
    )

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__create_reservation__pindora_mock__already_exists(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(),
        access_code_is_active=reservation.access_code_is_active,
        begin=reservation.begins_at.astimezone(DEFAULT_TIMEZONE),
        end=reservation.ends_at.astimezone(DEFAULT_TIMEZONE),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    with pytest.raises(PindoraConflictError):
        PindoraClient.create_reservation(reservation)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime(2024, 1, 1, 10),
        end=local_datetime(2024, 1, 1, 11),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    response = PindoraClient.reschedule_reservation(reservation)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_reservation_response(ext_uuid=reservation.ext_uuid)

    assert cached_response["begin"] == local_datetime(2024, 1, 1, 12)
    assert cached_response["end"] == local_datetime(2024, 1, 1, 13)
    assert cached_response["access_code_is_active"] is True

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation__pindora_mock__is_active(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=local_datetime(2024, 1, 1, 10),
        end=local_datetime(2024, 1, 1, 11),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    response = PindoraClient.reschedule_reservation(reservation, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_reservation_response(ext_uuid=reservation.ext_uuid)

    assert cached_response["access_code_is_active"] is True

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_reservation__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.reschedule_reservation(reservation)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@patch_method(PindoraClient._mock_create_access_code, return_value="54321")
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__change_reservation_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(2024, 1, 1, 10),
        access_code_is_active=True,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    response = PindoraClient.change_reservation_access_code(reservation)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_reservation_response(ext_uuid=reservation.ext_uuid)

    assert cached_response["access_code"] == "54321"

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__change_reservation_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.change_reservation_access_code(reservation)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__activate_reservation_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(2024, 1, 1, 10),
        access_code_is_active=False,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    PindoraClient.activate_reservation_access_code(reservation)

    cached_response = PindoraClient._get_cached_reservation_response(ext_uuid=reservation.ext_uuid)

    assert cached_response["access_code_is_active"] is True

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__activate_reservation_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.activate_reservation_access_code(reservation)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__deactivate_reservation_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(2024, 1, 1, 10),
        access_code_is_active=True,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    PindoraClient.deactivate_reservation_access_code(reservation)

    cached_response = PindoraClient._get_cached_reservation_response(ext_uuid=reservation.ext_uuid)

    assert cached_response["access_code_is_active"] is False

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__deactivate_reservation_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.deactivate_reservation_access_code(reservation)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__delete_reservation__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    reservation_data = PindoraReservationResponse(
        reservation_unit_id=reservation.reservation_unit.ext_uuid,
        access_code="123456",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=local_datetime(2024, 1, 1, 10),
        access_code_is_active=True,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
    )

    PindoraClient._cache_reservation_response(reservation_data, ext_uuid=reservation.ext_uuid)

    PindoraClient.delete_reservation(reservation)

    cached_response = PindoraClient._get_cached_reservation_response(ext_uuid=reservation.ext_uuid)

    assert cached_response is None

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__delete_reservation__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.delete_reservation(reservation)

    assert PindoraClient.request.call_count == 0
