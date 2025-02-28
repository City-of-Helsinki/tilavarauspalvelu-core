from __future__ import annotations

import uuid
from typing import Any, NamedTuple

from utils.date_utils import local_datetime


def default_reservation_unit_response(**overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraReservationUnitResponse`.
    return {
        "reservation_unit_id": str(uuid.uuid4()),
        "name": "foo",
        "keypad_url": "https://example.com",
        **overrides,
    }


def default_reservation_response(**overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraReservationResponse`.
    return {
        "reservation_unit_id": str(uuid.uuid4()),
        "access_code": "13245#",
        "access_code_keypad_url": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "access_code_phone_number": "+358407089833",
        "access_code_sms_number": "+358407089834",
        "access_code_sms_message": "a13245",
        "access_code_valid_minutes_before": 0,
        "access_code_valid_minutes_after": 0,
        "access_code_generated_at": local_datetime(2022, 1, 1).isoformat(),
        "access_code_is_active": True,
        "begin": local_datetime(2022, 1, 1, 12).isoformat(),
        "end": local_datetime(2022, 1, 1, 14).isoformat(),
        **overrides,
    }


def default_reservation_series_response(**overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraReservationSeriesResponse`.
    return {
        "reservation_unit_id": str(uuid.uuid4()),
        "access_code": "13245#",
        "access_code_keypad_url": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "access_code_phone_number": "+358407089833",
        "access_code_sms_number": "+358407089834",
        "access_code_sms_message": "a13245",
        "access_code_generated_at": local_datetime(2022, 1, 1).isoformat(),
        "access_code_is_active": True,
        "reservation_unit_code_validity": [
            {
                "access_code_valid_minutes_before": 0,
                "access_code_valid_minutes_after": 0,
                "begin": local_datetime(2022, 1, 1, 12).isoformat(),
                "end": local_datetime(2022, 1, 1, 14).isoformat(),
            },
        ],
        **overrides,
    }


def default_seasonal_booking_response(**overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraSeasonalBookingResponse`.
    return {
        "access_code": "13245#",
        "access_code_keypad_url": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "access_code_phone_number": "+358407089833",
        "access_code_sms_number": "+358407089834",
        "access_code_sms_message": "a13245",
        "access_code_generated_at": local_datetime(2022, 1, 1).isoformat(),
        "access_code_is_active": True,
        "reservation_unit_code_validity": [
            {
                "reservation_unit_id": str(uuid.uuid4()),
                "access_code_valid_minutes_before": 0,
                "access_code_valid_minutes_after": 0,
                "begin": local_datetime(2022, 1, 1, 12).isoformat(),
                "end": local_datetime(2022, 1, 1, 14).isoformat(),
            },
        ],
        **overrides,
    }


def default_access_code_modify_response(**overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraAccessCodeModifyResponse`.
    return {
        "access_code_generated_at": local_datetime(2022, 1, 1).isoformat(),
        "access_code_is_active": True,
        **overrides,
    }


class ErrorParams(NamedTuple):
    status_code: int
    exception: type[Exception]
    error_msg: str = ""
