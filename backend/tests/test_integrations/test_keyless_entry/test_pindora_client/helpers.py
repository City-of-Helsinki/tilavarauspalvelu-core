from __future__ import annotations

from typing import TYPE_CHECKING, Any, NamedTuple

from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation, ReservationUnit


def default_reservation_unit_response(reservation_unit: ReservationUnit, **overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraReservationUnitResponse`.
    return {
        "reservation_unit_id": str(reservation_unit.uuid),
        "name": reservation_unit.name,
        "keypad_url": "https://example.com",
        **overrides,
    }


def default_reservation_response(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraReservationResponse`.
    return {
        "reservation_unit_id": str(reservation.ext_uuid),
        "access_code": "13245#",
        "access_code_keypad_url": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "access_code_phone_number": "+358407089833",
        "access_code_sms_number": "+358407089834",
        "access_code_sms_message": "a13245",
        "access_code_valid_minutes_before": 0,
        "access_code_valid_minutes_after": 0,
        "access_code_generated_at": reservation.created_at.astimezone(DEFAULT_TIMEZONE).isoformat(),
        "access_code_is_active": True,
        "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE).isoformat(),
        "end": reservation.end.astimezone(DEFAULT_TIMEZONE).isoformat(),
        **overrides,
    }


def default_seasonal_booking_response(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraSeasonalBookingResponse`.
    return {
        "access_code": "13245#",
        "access_code_keypad_url": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "access_code_phone_number": "+358407089833",
        "access_code_sms_number": "+358407089834",
        "access_code_sms_message": "a13245",
        "access_code_generated_at": reservation.created_at.astimezone(DEFAULT_TIMEZONE).isoformat(),
        "access_code_is_active": True,
        "reservation_unit_code_validity": [
            {
                "reservation_unit_id": str(reservation.ext_uuid),
                "access_code_valid_minutes_before": 0,
                "access_code_valid_minutes_after": 0,
                "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE).isoformat(),
                "end": reservation.end.astimezone(DEFAULT_TIMEZONE).isoformat(),
            },
        ],
        **overrides,
    }


def default_reservation_series_response(reservation: Reservation, **overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraReservationSeriesResponse`.
    return {
        "reservation_unit_id": str(reservation.ext_uuid),
        "access_code": "13245#",
        "access_code_keypad_url": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "access_code_phone_number": "+358407089833",
        "access_code_sms_number": "+358407089834",
        "access_code_sms_message": "a13245",
        "access_code_generated_at": reservation.created_at.astimezone(DEFAULT_TIMEZONE).isoformat(),
        "access_code_is_active": True,
        "reservation_unit_code_validity": [
            {
                "access_code_valid_minutes_before": 0,
                "access_code_valid_minutes_after": 0,
                "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE).isoformat(),
                "end": reservation.end.astimezone(DEFAULT_TIMEZONE).isoformat(),
            },
        ],
        **overrides,
    }


def default_access_code_modify_response(**overrides: Any) -> dict[str, Any]:
    # This is the json response form Pindora API, which is processed to `PindoraAccessCodeModifyResponse`.
    return {
        "access_code_generated_at": local_datetime().isoformat(),
        "access_code_is_active": True,
        **overrides,
    }


class ErrorParams(NamedTuple):
    status_code: int
    exception: type[Exception]
    error_msg: str = ""
