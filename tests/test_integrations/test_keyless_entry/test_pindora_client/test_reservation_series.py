from __future__ import annotations

import pytest
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_418_IM_A_TEAPOT,
)

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from tests.factories import RecurringReservationFactory, ReservationFactory
from tests.helpers import ResponseMock, exact, patch_method
from tests.test_integrations.test_keyless_entry.helpers import default_reservation_series_response


def test_pindora_client__get_reservation_series():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
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


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__get_reservation_series__403():
    series = RecurringReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__get_reservation_series__400():
    series = RecurringReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__get_reservation_series__404():
    series = RecurringReservationFactory.build()

    msg = f"Reservation series '{series.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__get_reservation__not_200():
    series = RecurringReservationFactory.build()

    msg = f"Unexpected response from Pindora when fetching reservation series '{series.ext_uuid}': [418] I'm a teapot"
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__missing_key():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)
    data.pop("reservation_unit_id")

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    )

    msg = "Missing key in reservation series response from Pindora: 'reservation_unit_id'"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


def test_pindora_client__get_reservation_series__invalid_data():
    series = RecurringReservationFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_reservation_series_response(reservation)
    data["reservation_unit_id"] = str(reservation.id)

    patch = patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    )

    msg = "Invalid value in reservation series response from Pindora: badly formed hexadecimal UUID string"
    with patch, pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_reservation_series(series)


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_reservation_series(is_active: bool):
    recurring_reservation = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
    )

    data = default_reservation_series_response(reservation, access_code_is_active=is_active)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.create_reservation_series(recurring_reservation, is_active=is_active)

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


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__403():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__400():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__409():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = f"Reservation series '{recurring_reservation.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__not_200():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = (
        f"Unexpected response from Pindora when creating reservation series '{recurring_reservation.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_200_OK),
)
@pytest.mark.django_db
def test_pindora_client__create_reservation_series__no_reservations():
    recurring_reservation = RecurringReservationFactory.create()

    msg = f"No reservations in for reservation series '{recurring_reservation.ext_uuid}'."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__update_reservation_series(is_active: bool):
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    PindoraClient.update_reservation_series(recurring_reservation, is_active=is_active)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
@pytest.mark.django_db
def test_pindora_client__update_reservation_series__403():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
@pytest.mark.django_db
def test_pindora_client__update_reservation_series__400():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
@pytest.mark.django_db
def test_pindora_client__update_reservation_series__404():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = f"Reservation series '{recurring_reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
@pytest.mark.django_db
def test_pindora_client__update_reservation_series__409():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = f"Reservation series '{recurring_reservation.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
@pytest.mark.django_db
def test_pindora_client__update_reservation_series__not_204():
    recurring_reservation = RecurringReservationFactory.create()
    ReservationFactory.create(recurring_reservation=recurring_reservation)

    msg = (
        f"Unexpected response from Pindora when updating reservation series '{recurring_reservation.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_200_OK),
)
@pytest.mark.django_db
def test_pindora_client__update_reservation_series__no_reservations():
    recurring_reservation = RecurringReservationFactory.create()

    msg = f"No reservations in for reservation series '{recurring_reservation.ext_uuid}'."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
def test_pindora_client__delete_reservation_series():
    recurring_reservation = RecurringReservationFactory.build()

    PindoraClient.delete_reservation_series(recurring_reservation)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__delete_reservation_series__403():
    recurring_reservation = RecurringReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__delete_reservation_series__400():
    recurring_reservation = RecurringReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__delete_reservation_series__404():
    recurring_reservation = RecurringReservationFactory.build()

    msg = f"Reservation series '{recurring_reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
def test_pindora_client__delete_reservation_series__409():
    recurring_reservation = RecurringReservationFactory.build()

    msg = f"Reservation series '{recurring_reservation.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation_series(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__delete_reservation_series__non_204():
    recurring_reservation = RecurringReservationFactory.build()

    msg = (
        f"Unexpected response from Pindora when deleting reservation series '{recurring_reservation.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_reservation_series(recurring_reservation)


@pytest.mark.django_db
def test_pindora_client__change_reservation_series_access_code():
    recurring_reservation = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(recurring_reservation=recurring_reservation, created_at=local_datetime())

    data = default_reservation_series_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.change_reservation_series_access_code(recurring_reservation)

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


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__change_reservation_series_access_code__403():
    recurring_reservation = RecurringReservationFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_series_access_code(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__change_reservation_series_access_code__400():
    recurring_reservation = RecurringReservationFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_series_access_code(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__change_reservation_series_access_code__404():
    recurring_reservation = RecurringReservationFactory.build()

    msg = f"Reservation series '{recurring_reservation.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_series_access_code(recurring_reservation)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__change_reservation_series_access_code__not_200():
    recurring_reservation = RecurringReservationFactory.build()

    msg = (
        f"Unexpected response from Pindora when changing access code for reservation series "
        f"'{recurring_reservation.ext_uuid}': [418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_reservation_series_access_code(recurring_reservation)
