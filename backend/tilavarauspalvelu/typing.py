from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Literal, NamedTuple, NotRequired, Protocol, TypedDict

from django.contrib.auth.models import AnonymousUser
from django.core.handlers import wsgi
from django.db import models
from graphql import GraphQLResolveInfo
from rest_framework.exceptions import ValidationError

if TYPE_CHECKING:
    import datetime

    from django.contrib.sessions.backends.cache import SessionStore

    from tilavarauspalvelu.enums import (
        AccessType,
        PaymentType,
        ReservationCancelReasonChoice,
        ReservationStateChoice,
        ReservationTypeChoice,
        ReservationTypeStaffChoice,
        ReserveeType,
        Weekday,
    )
    from tilavarauspalvelu.models import AgeGroup, ReservationDenyReason, ReservationPurpose, ReservationUnit, User

__all__ = [
    "AffectedTimeSpan",
    "Allocation",
    "AnyUser",
    "EmailContext",
    "ErrorList",
    "GQLInfo",
    "HTTPMethod",
    "Lang",
    "M2MAction",
    "QueryInfo",
    "SessionMapping",
    "TimeSlot",
    "TimeSlotDB",
    "TimeSpan",
    "UserAnonymizationInfo",
    "WSGIRequest",
    "permission",
]


class permission(classmethod): ...  # noqa: N801


type AnyUser = User | AnonymousUser
type Lang = Literal["fi", "sv", "en"]
type TextSearchLang = Literal["finnish", "english", "swedish"]
type HTTPMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
type EmailContext = dict[str, str | int | Decimal | EmailContext | list[EmailContext] | None]
type Action = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
type ErrorList = list[ValidationError]


class AffectedTimeSpan(TypedDict):
    start_datetime: str
    end_datetime: str
    buffer_time_before: str
    buffer_time_after: str
    is_blocking: bool


class TimeSpan(TypedDict):
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime


class TimeSlot(TypedDict):
    begin: datetime.time
    end: datetime.time


class Allocation(TypedDict):
    reservation_unit: ReservationUnit
    day_of_the_week: Weekday
    begin_time: datetime.time
    end_time: datetime.time


class TimeSlotDB(TypedDict):
    """
    Timeslots must be stored as string in HSField,
    but we want to use `datetime.time` in the code.
    """

    begin: str  # datetime.time
    end: str  # datetime.time


class WSGIRequest(wsgi.WSGIRequest):  # noqa: TID251
    user: AnyUser
    session: SessionStore


class GQLInfo(GraphQLResolveInfo):
    context = WSGIRequest


class QueryInfo(TypedDict):
    sql: str
    duration_ns: int
    succeeded: bool
    stack_info: str


class SessionMapping(Protocol):
    def __setitem__(self, key: str, value: Any) -> None: ...

    def get(self, key: str, default: Any = None) -> Any: ...


class EmailAttachment(TypedDict):
    filename: str
    content: str
    mimetype: str


@dataclass
class UserAnonymizationInfo:
    has_open_reservations: bool
    has_open_applications: bool
    has_open_payments: bool

    def __bool__(self) -> bool:
        return not (self.has_open_reservations or self.has_open_applications or self.has_open_payments)


class ExtraData(TypedDict):
    id: str
    """User's uuid: uuid"""
    id_token: str
    """IDToken as a JWT: str"""
    auth_time: int
    """When the user authenticated: unix epoch timestamp"""
    token_type: str
    """Token type: bearer"""
    access_token: str
    """Access token: str"""
    refresh_token: str
    """Refresh token: str"""


class ReservationCreateData(TypedDict):
    reservation_unit: NotRequired[ReservationUnit]  # Required but removed before mutation

    begins_at: datetime.datetime
    ends_at: datetime.datetime

    # Added automatically
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]
    user: NotRequired[User]
    reservee_used_ad_login: NotRequired[bool]
    price: NotRequired[Decimal]
    unit_price: NotRequired[Decimal]
    tax_percentage_value: NotRequired[Decimal]
    non_subsidised_price: NotRequired[Decimal]
    access_type: NotRequired[AccessType]

    # From prefill
    reservee_first_name: NotRequired[str | None]
    reservee_last_name: NotRequired[str | None]
    reservee_email: NotRequired[str | None]
    reservee_phone: NotRequired[str | None]
    reservee_address_street: NotRequired[str | None]
    reservee_address_zip: NotRequired[str | None]
    reservee_address_city: NotRequired[str | None]
    municipality: NotRequired[str | None]


class ReservationUpdateData(TypedDict):
    pk: int

    name: NotRequired[str]
    num_persons: NotRequired[int]
    description: NotRequired[str]
    municipality: NotRequired[str | None]

    applying_for_free_of_charge: NotRequired[bool]
    free_of_charge_reason: NotRequired[str | None]

    reservee_id: NotRequired[str]
    reservee_first_name: NotRequired[str]
    reservee_last_name: NotRequired[str]
    reservee_email: NotRequired[str | None]
    reservee_phone: NotRequired[str]
    reservee_organisation_name: NotRequired[str]
    reservee_address_street: NotRequired[str]
    reservee_address_city: NotRequired[str]
    reservee_address_zip: NotRequired[str]
    reservee_type: NotRequired[ReserveeType]

    purpose: NotRequired[ReservationPurpose | None]
    age_group: NotRequired[AgeGroup | None]

    state: NotRequired[ReservationStateChoice]


class ReservationConfirmData(TypedDict):
    pk: int

    confirmed_at: NotRequired[datetime.datetime]
    payment_type: NotRequired[PaymentType | None]
    state: NotRequired[ReservationStateChoice]


class ReservationAdjustTimeData(TypedDict):
    pk: NotRequired[int]
    begins_at: datetime.datetime
    ends_at: datetime.datetime

    state: NotRequired[ReservationStateChoice]
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]
    access_type: NotRequired[AccessType]


class ReservationApproveData(TypedDict):
    pk: int
    price: Decimal
    handling_details: str

    state: NotRequired[ReservationStateChoice]
    handled_at: NotRequired[datetime.datetime]
    access_code_generated_at: NotRequired[datetime.datetime | None]
    access_code_is_active: NotRequired[bool]
    payment_type: NotRequired[PaymentType]
    handled_payment_due_by: NotRequired[datetime.datetime]
    tax_percentage_value: NotRequired[Decimal]
    should_delete_previous_payment_order: NotRequired[bool]


class ReservationCancellationData(TypedDict):
    pk: int

    cancel_details: str
    cancel_reason: ReservationCancelReasonChoice

    state: NotRequired[ReservationStateChoice]
    access_code_generated_at: NotRequired[datetime.datetime | None]
    access_code_is_active: NotRequired[bool]


class ReservationDenyData(TypedDict):
    pk: int

    deny_reason: ReservationDenyReason
    handling_details: str

    state: NotRequired[ReservationStateChoice]
    handled_at: NotRequired[datetime.datetime]
    access_code_generated_at: NotRequired[datetime.datetime | None]
    access_code_is_active: NotRequired[bool]


class StaffCreateReservationData(TypedDict):
    reservation_unit: NotRequired[ReservationUnit]  # Required but removed before mutation

    name: NotRequired[str]
    description: NotRequired[str]
    num_persons: NotRequired[int]
    working_memo: NotRequired[str]
    type: NotRequired[ReservationTypeChoice]
    municipality: NotRequired[str | None]

    begins_at: NotRequired[datetime.datetime]
    ends_at: NotRequired[datetime.datetime]
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]

    applying_for_free_of_charge: NotRequired[bool]
    free_of_charge_reason: NotRequired[str | None]

    reservee_id: NotRequired[str]
    reservee_first_name: NotRequired[str]
    reservee_last_name: NotRequired[str]
    reservee_email: NotRequired[str | None]
    reservee_phone: NotRequired[str]
    reservee_organisation_name: NotRequired[str]
    reservee_address_street: NotRequired[str]
    reservee_address_city: NotRequired[str]
    reservee_address_zip: NotRequired[str]
    reservee_type: NotRequired[ReserveeType]

    age_group: NotRequired[ReservationPurpose | None]
    purpose: NotRequired[AgeGroup | None]

    state: NotRequired[ReservationStateChoice]
    confirmed_at: NotRequired[datetime.datetime]
    handled_at: NotRequired[datetime.datetime]
    user: User
    reservee_used_ad_login: bool
    access_type: NotRequired[AccessType]
    access_code_is_active: NotRequired[bool]


class StaffReservationData(StaffCreateReservationData):
    pk: int


class StaffReservationAdjustTimeData(TypedDict):
    pk: NotRequired[int]
    begins_at: datetime.datetime
    ends_at: datetime.datetime

    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]
    access_type: NotRequired[AccessType]


class ReservationSeriesCreateData(TypedDict):
    pk: int
    user: User
    name: str
    description: str
    reservation_unit: int
    age_group: int
    recurrence_in_days: int
    weekdays: list[int]
    begin_time: datetime.time
    end_time: datetime.time
    begin_date: datetime.date
    end_date: datetime.date


class ReservationSeriesAddData(TypedDict):
    pk: int
    begins_at: datetime.datetime
    ends_at: datetime.datetime
    buffer_time_before: datetime.timedelta
    buffer_time_after: datetime.timedelta
    access_type: AccessType


class ReservationSeriesRescheduleData(TypedDict):
    pk: int
    begin_date: datetime.date
    begin_time: datetime.time
    end_date: datetime.date
    end_time: datetime.time
    weekdays: list[int]
    buffer_time_before: datetime.timedelta
    buffer_time_after: datetime.timedelta
    skip_dates: list[datetime.date]
    access_type: AccessType


class PindoraReservationInfoData(NamedTuple):
    access_code: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool

    access_code_keypad_url: str
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str

    access_code_begins_at: datetime.datetime
    access_code_ends_at: datetime.datetime


class PindoraValidityInfoData(NamedTuple):
    reservation_id: int
    reservation_series_id: int
    access_code_begins_at: datetime.datetime
    access_code_ends_at: datetime.datetime


class PindoraSeriesInfoData(NamedTuple):
    access_code: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool

    access_code_keypad_url: str
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str

    access_code_validity: list[PindoraValidityInfoData]


class PindoraSectionInfoData(NamedTuple):
    access_code: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool

    access_code_keypad_url: str
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str

    access_code_validity: list[PindoraValidityInfoData]


class ReservationPeriod(TypedDict):
    begin: datetime.datetime
    end: datetime.datetime


class ReservationDetails(TypedDict, total=False):
    name: str
    description: str
    num_persons: int
    state: ReservationStateChoice
    type: ReservationTypeChoice | ReservationTypeStaffChoice
    municipality: str | None  # MunicipalityChoice
    working_memo: str

    buffer_time_before: datetime.timedelta
    buffer_time_after: datetime.timedelta
    handled_at: datetime.datetime
    confirmed_at: datetime.datetime

    applying_for_free_of_charge: bool
    free_of_charge_reason: bool

    reservee_identifier: str
    reservee_first_name: str
    reservee_last_name: str
    reservee_email: str | None
    reservee_phone: str
    reservee_organisation_name: str
    reservee_address_street: str
    reservee_address_city: str
    reservee_address_zip: str
    reservee_type: ReserveeType

    user: int | User | None
    purpose: int | ReservationPurpose | None
    age_group: int | AgeGroup | None


class PreSaveKwargs[TModel: models.Model](TypedDict):
    instance: TModel
    raw: bool
    using: str | None
    update_fields: list[str] | None


class PostSaveKwargs[TModel: models.Model](TypedDict):
    instance: TModel
    created: bool
    raw: bool
    using: str | None
    update_fields: list[str] | None


class PreDeleteKwargs[TModel: models.Model](TypedDict):
    instance: TModel
    using: str | None
    origin: TModel | models.QuerySet[TModel] | None


class PostDeleteKwargs[TModel: models.Model](TypedDict):
    instance: TModel
    using: str | None
    origin: TModel | models.QuerySet[TModel] | None


class M2MChangedKwargs[TModel: models.Model](TypedDict):
    action: M2MAction
    instance: TModel
    reverse: bool
    model: type[TModel]
    pk_set: set[int] | None
    using: str | None
