from __future__ import annotations

from typing import TYPE_CHECKING, NotRequired, TypedDict

if TYPE_CHECKING:
    import datetime
    import uuid

__all__ = [
    "PindoraReservationCreateData",
    "PindoraReservationResponse",
    "PindoraReservationSeriesAccessCodeValidity",
    "PindoraReservationSeriesResponse",
    "PindoraReservationUnitResponse",
    "PindoraSeasonalBookingAccessCodeValidity",
    "PindoraSeasonalBookingCreateData",
    "PindoraSeasonalBookingReservationData",
    "PindoraSeasonalBookingResponse",
    "PindoraSeasonalBookingUpdateData",
    "PindoraUpdateReservationData",
]


#############
# Responses #
#############


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
    access_code_is_active: bool
    begin: datetime.datetime
    end: datetime.datetime


class PindoraSeasonalBookingAccessCodeValidity(TypedDict):
    reservation_unit_id: uuid.UUID
    access_code_valid_minutes_before: int
    access_code_valid_minutes_after: int
    begin: datetime.datetime
    end: datetime.datetime


class PindoraReservationSeriesAccessCodeValidity(TypedDict):
    access_code_valid_minutes_before: int
    access_code_valid_minutes_after: int
    begin: datetime.datetime
    end: datetime.datetime


class PindoraSeasonalBookingResponse(TypedDict):
    access_code: str
    access_code_keypad_url: str  # url
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool
    reservation_unit_code_validity: list[PindoraSeasonalBookingAccessCodeValidity]


class PindoraReservationSeriesResponse(TypedDict):
    reservation_unit_id: uuid.UUID
    access_code: str
    access_code_keypad_url: str  # url
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool
    reservation_unit_code_validity: list[PindoraReservationSeriesAccessCodeValidity]


################
# Request data #
################


class PindoraReservationCreateData(TypedDict):
    reservation_id: str  # uuid
    reservation_unit_id: str  # uuid
    begin: str  # datetime
    end: str  # datetime
    is_active: NotRequired[bool]  # default: false


class PindoraUpdateReservationData(TypedDict):
    begin: str  # datetime
    end: str  # datetime
    is_active: NotRequired[bool]  # default: false


class PindoraSeasonalBookingReservationData(TypedDict):
    reservation_unit_id: str  # uuid
    begin: str  # datetime
    end: str  # datetime


class PindoraSeasonalBookingCreateData(TypedDict):
    seasonal_booking_id: str  # uuid
    series: list[PindoraSeasonalBookingReservationData]
    is_active: NotRequired[bool]  # default: false


class PindoraSeasonalBookingUpdateData(TypedDict):
    series: list[PindoraSeasonalBookingReservationData]
    is_active: NotRequired[bool]  # default: false


class PindoraReservationSeriesReservationData(TypedDict):
    begin: str  # datetime
    end: str  # datetime


class PindoraReservationSeriesCreateData(TypedDict):
    reservation_serie_id: str  # uuid
    reservation_unit_id: str  # uuid
    series: list[PindoraReservationSeriesReservationData]
    is_active: NotRequired[bool]  # default: false


class PindoraReservationSeriesUpdateData(TypedDict):
    series: list[PindoraReservationSeriesReservationData]
    is_active: NotRequired[bool]  # default: false
