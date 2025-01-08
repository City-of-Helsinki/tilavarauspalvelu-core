from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

if TYPE_CHECKING:
    import datetime
    import uuid

__all__ = [
    "PindoraReservationCreateData",
    "PindoraReservationResponse",
    "PindoraReservationUnitResponse",
    "PindoraUpdateReservationTimeData",
]


class PindoraReservationUnitResponse(TypedDict):
    reservation_unit_id: uuid.UUID
    name: str
    keypad_url: str  # url


class PindoraReservationResponse(TypedDict):
    reservation_unit_id: uuid.UUID
    access_code: str
    access_code_keypad_url: str  # url
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str
    access_code_valid_minutes_before: int
    access_code_valid_minutes_after: int
    access_code_generated_at: datetime.datetime
    begin: datetime.datetime
    end: datetime.datetime


class PindoraReservationCreateData(TypedDict):
    reservation_id: str  # uuid
    reservation_unit_id: str  # uuid
    begin: str  # datetime
    end: str  # datetime


class PindoraUpdateReservationTimeData(TypedDict):
    begin: str  # datetime
    end: str  # datetime
