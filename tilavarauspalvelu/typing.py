from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Literal, NotRequired, Protocol, TypedDict

from django.contrib.auth.models import AnonymousUser
from django.core.handlers import wsgi
from graphql import GraphQLResolveInfo

if TYPE_CHECKING:
    import datetime

    from django.contrib.sessions.backends.cache import SessionStore

    from tilavarauspalvelu.enums import CustomerTypeChoice, PaymentType, ReservationStateChoice, ReservationTypeChoice
    from tilavarauspalvelu.models import (
        AgeGroup,
        City,
        ReservationCancelReason,
        ReservationDenyReason,
        ReservationPurpose,
        ReservationUnit,
        User,
    )

__all__ = [
    "AffectedTimeSpan",
    "AnyUser",
    "EmailContext",
    "GQLInfo",
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
type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
type EmailContext = dict[str, str | int | Decimal | None]


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

    begin: datetime.datetime
    end: datetime.datetime

    # Added automatically
    sku: NotRequired[str]
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]
    user: NotRequired[User]
    reservee_used_ad_login: NotRequired[bool]
    price: NotRequired[Decimal]
    unit_price: NotRequired[Decimal]
    tax_percentage_value: NotRequired[Decimal]
    non_subsidised_price: NotRequired[Decimal]

    # From prefill
    reservee_first_name: NotRequired[str | None]
    reservee_last_name: NotRequired[str | None]
    reservee_email: NotRequired[str | None]
    reservee_phone: NotRequired[str | None]
    reservee_address_street: NotRequired[str | None]
    reservee_address_zip: NotRequired[str | None]
    reservee_address_city: NotRequired[str | None]
    home_city: NotRequired[City | None]


class ReservationUpdateData(TypedDict):
    pk: int

    name: NotRequired[str]
    num_persons: NotRequired[int]
    description: NotRequired[str]

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
    reservee_is_unregistered_association: NotRequired[bool]
    reservee_type: NotRequired[CustomerTypeChoice]

    billing_first_name: NotRequired[str]
    billing_last_name: NotRequired[str]
    billing_email: NotRequired[str | None]
    billing_phone: NotRequired[str]
    billing_address_street: NotRequired[str]
    billing_address_city: NotRequired[str]
    billing_address_zip: NotRequired[str]

    purpose: NotRequired[ReservationPurpose | None]
    home_city: NotRequired[City | None]
    age_group: NotRequired[AgeGroup | None]

    state: NotRequired[ReservationStateChoice]


class ReservationConfirmData(TypedDict):
    pk: int

    confirmed_at: NotRequired[datetime.datetime]
    payment_type: NotRequired[PaymentType | None]
    state: NotRequired[ReservationStateChoice]


class ReservationAdjustTimeData(TypedDict):
    pk: int
    begin: datetime.datetime
    end: datetime.datetime

    state: NotRequired[ReservationStateChoice]
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]


class ReservationApproveData(TypedDict):
    pk: int
    price: Decimal
    handling_details: str

    state: NotRequired[ReservationStateChoice]
    handled_at: NotRequired[datetime.datetime]


class ReservationCancellationData(TypedDict):
    pk: int

    cancel_details: str
    cancel_reason: ReservationCancelReason

    state: NotRequired[ReservationStateChoice]


class ReservationDenyData(TypedDict):
    pk: int

    deny_reason: ReservationDenyReason
    handling_details: str

    state: NotRequired[ReservationStateChoice]
    handled_at: NotRequired[datetime.datetime]


class StaffCreateReservationData(TypedDict):
    reservation_unit: NotRequired[ReservationUnit]  # Required but removed before mutation

    name: NotRequired[str]
    description: NotRequired[str]
    num_persons: NotRequired[int]
    working_memo: NotRequired[str]
    type: NotRequired[ReservationTypeChoice]

    begin: NotRequired[datetime.datetime]
    end: NotRequired[datetime.datetime]
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
    reservee_is_unregistered_association: NotRequired[bool]
    reservee_type: NotRequired[CustomerTypeChoice]

    billing_first_name: NotRequired[str]
    billing_last_name: NotRequired[str]
    billing_email: NotRequired[str | None]
    billing_phone: NotRequired[str]
    billing_address_street: NotRequired[str]
    billing_address_city: NotRequired[str]
    billing_address_zip: NotRequired[str]

    age_group: NotRequired[ReservationPurpose | None]
    home_city: NotRequired[City | None]
    purpose: NotRequired[AgeGroup | None]

    state: NotRequired[ReservationStateChoice]
    confirmed_at: NotRequired[datetime.datetime]
    handled_at: NotRequired[datetime.datetime]
    user: User
    reservee_used_ad_login: bool


class StaffReservationData(StaffCreateReservationData):
    pk: int
