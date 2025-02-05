from __future__ import annotations

import uuid

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraReservationResponse,
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesResponse,
    PindoraReservationUnitResponse,
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from utils.date_utils import local_datetime


def test_pindora_client__caching__reservation_unit_response():
    reservation_unit_id = uuid.uuid4()
    data = PindoraReservationUnitResponse(
        reservation_unit_id=reservation_unit_id,
        name="foo",
        keypad_url="https://example.com",
    )

    PindoraClient.cache_reservation_unit_response(data=data, ext_uuid=reservation_unit_id)

    response = PindoraClient.get_cached_reservation_unit_response(ext_uuid=reservation_unit_id)
    assert response == data

    succeeded = PindoraClient.clear_cached_reservation_unit_response(ext_uuid=reservation_unit_id)
    assert succeeded is True

    response = PindoraClient.get_cached_reservation_unit_response(ext_uuid=reservation_unit_id)
    assert response is None


def test_pindora_client__caching__reservation_response():
    reservation_id = uuid.uuid4()

    data = PindoraReservationResponse(
        reservation_unit_id=uuid.uuid4(),
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_valid_minutes_before=10,
        access_code_valid_minutes_after=5,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
    )

    PindoraClient.cache_reservation_response(data=data, ext_uuid=reservation_id)

    response = PindoraClient.get_cached_reservation_response(ext_uuid=reservation_id)
    assert response == data

    succeeded = PindoraClient.clear_cached_reservation_response(ext_uuid=reservation_id)
    assert succeeded is True

    response = PindoraClient.get_cached_reservation_response(ext_uuid=reservation_id)
    assert response is None


def test_pindora_client__caching__seasonal_booking_response():
    section_id = uuid.uuid4()

    data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=uuid.uuid4(),
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
            ),
        ],
    )

    PindoraClient.cache_seasonal_booking_response(data=data, ext_uuid=section_id)

    response = PindoraClient.get_cached_seasonal_booking_response(ext_uuid=section_id)
    assert response == data

    succeeded = PindoraClient.clear_cached_seasonal_booking_response(ext_uuid=section_id)
    assert succeeded is True

    response = PindoraClient.get_cached_seasonal_booking_response(ext_uuid=section_id)
    assert response is None


def test_pindora_client__caching__reservation_series_response():
    series_id = uuid.uuid4()

    data = PindoraReservationSeriesResponse(
        reservation_unit_id=uuid.uuid4(),
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
            ),
        ],
    )

    PindoraClient.cache_reservation_series_response(data=data, ext_uuid=series_id)

    response = PindoraClient.get_cached_reservation_series_response(ext_uuid=series_id)
    assert response == data

    succeeded = PindoraClient.clear_cached_reservation_series_response(ext_uuid=series_id)
    assert succeeded is True

    response = PindoraClient.get_cached_reservation_series_response(ext_uuid=series_id)
    assert response is None
