from __future__ import annotations

from typing import TYPE_CHECKING, NotRequired, TypedDict

if TYPE_CHECKING:
    import datetime
    import uuid

__all__ = [
    "PindoraAccessCodeModifyResponse",
    "PindoraAccessCodePeriod",
    "PindoraReservationCreateData",
    "PindoraReservationRescheduleData",
    "PindoraReservationResponse",
    "PindoraReservationSeriesAccessCodeValidity",
    "PindoraReservationSeriesCreateData",
    "PindoraReservationSeriesRescheduleData",
    "PindoraReservationSeriesReservationData",
    "PindoraReservationSeriesResponse",
    "PindoraReservationUnitResponse",
    "PindoraSeasonalBookingAccessCodeValidity",
    "PindoraSeasonalBookingCreateData",
    "PindoraSeasonalBookingRescheduleData",
    "PindoraSeasonalBookingReservationData",
    "PindoraSeasonalBookingResponse",
]


#############
# Responses #
#############


class PindoraReservationUnitResponse(TypedDict):
    reservation_unit_id: uuid.UUID
    name: str
    keypad_url: str  # url


class PindoraAccessCodeModifyResponse(TypedDict):
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool


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


class PindoraAccessCodeValidity(TypedDict):
    access_code_valid_minutes_before: int
    access_code_valid_minutes_after: int
    begin: datetime.datetime
    end: datetime.datetime


class PindoraAccessCodePeriod(TypedDict):
    access_code_begins_at: datetime.datetime
    access_code_ends_at: datetime.datetime


class PindoraSeasonalBookingAccessCodeValidity(PindoraAccessCodeValidity):
    reservation_unit_id: uuid.UUID


class PindoraSeasonalBookingResponse(TypedDict):
    access_code: str
    access_code_keypad_url: str  # url
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool
    reservation_unit_code_validity: list[PindoraSeasonalBookingAccessCodeValidity]


class PindoraReservationSeriesAccessCodeValidity(PindoraAccessCodeValidity): ...


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
    is_active: NotRequired[bool]  # default: false (access code will not become active when reservation starts)


class PindoraReservationRescheduleData(TypedDict):
    begin: str  # datetime
    end: str  # datetime
    is_active: NotRequired[bool]


class PindoraSeasonalBookingReservationData(TypedDict):
    reservation_unit_id: str  # uuid
    begin: str  # datetime
    end: str  # datetime


class PindoraSeasonalBookingCreateData(TypedDict):
    seasonal_booking_id: str  # uuid
    series: list[PindoraSeasonalBookingReservationData]
    is_active: NotRequired[bool]  # default: false (access code will not become active when reservation starts)


class PindoraSeasonalBookingRescheduleData(TypedDict):
    series: list[PindoraSeasonalBookingReservationData]


class PindoraReservationSeriesReservationData(TypedDict):
    begin: str  # datetime
    end: str  # datetime


class PindoraReservationSeriesCreateData(TypedDict):
    reservation_series_id: str  # uuid
    reservation_unit_id: str  # uuid
    series: list[PindoraReservationSeriesReservationData]
    is_active: NotRequired[bool]  # default: false (access code will not become active when reservation starts)


class PindoraReservationSeriesRescheduleData(TypedDict):
    series: list[PindoraReservationSeriesReservationData]
