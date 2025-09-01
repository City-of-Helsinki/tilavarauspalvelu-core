from __future__ import annotations

import datetime
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum, auto
from typing import TYPE_CHECKING, Any, Literal, NamedTuple, NotRequired, Protocol, Required, TypedDict

from django.contrib.auth.models import AnonymousUser
from django.core.files.uploadedfile import UploadedFile
from django.core.handlers import wsgi
from django.db import models
from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    MunicipalityChoice,
    PaymentType,
    PriceUnit,
    ReservationCancelReasonChoice,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReservationTypeStaffChoice,
    ReservationUnitImageType,
    ReserveeType,
    Weekday,
)

if TYPE_CHECKING:
    from django.contrib.sessions.backends.cache import SessionStore

    from tilavarauspalvelu.models import (
        AgeGroup,
        ApplicationRound,
        Equipment,
        Purpose,
        ReservationDenyReason,
        ReservationMetadataSet,
        ReservationPurpose,
        ReservationUnit,
        ReservationUnitCancellationRule,
        ReservationUnitOption,
        ReservationUnitType,
        Resource,
        Space,
        TaxPercentage,
        TermsOfUse,
        Unit,
        User,
    )

__all__ = [
    "AffectedTimeSpan",
    "Allocation",
    "AnyUser",
    "EmailContext",
    "ErrorList",
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
    "error_codes",
]


type AnyUser = User | AnonymousUser
type Lang = Literal["fi", "sv", "en"]
type TextSearchLang = Literal["finnish", "english", "swedish"]
type HTTPMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
type EmailContext = dict[str, str | int | Decimal | EmailContext | list[EmailContext] | None]
type Action = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
type ErrorList = list[GraphQLValidationError]


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


class Allocation(TypedDict):
    reservation_unit: ReservationUnit
    day_of_the_week: Weekday
    begin_time: datetime.time
    end_time: datetime.time


class WSGIRequest(wsgi.WSGIRequest):  # noqa: TID251
    user: AnyUser
    session: SessionStore


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


class AllocatedTimeSlotCreateData(TypedDict):
    reservation_unit_option: ReservationUnitOption
    day_of_the_week: Weekday
    begin_time: datetime.time
    end_time: datetime.time
    force: bool


class ReservationUnitOptionRelatedCreateData(TypedDict):
    preferred_order: int
    reservation_unit: ReservationUnit


class ReservationUnitOptionRelatedUpdateData(TypedDict, total=False):
    pk: Required[int]

    preferred_order: int
    reservation_unit: ReservationUnit


class SuitableTimeRangeRelatedCreateData(TypedDict):
    priority: int

    day_of_the_week: Weekday
    begin_time: datetime.time
    end_time: datetime.time


class SuitableTimeRangeRelatedUpdateData(TypedDict, total=False):
    pk: Required[int]

    priority: int
    day_of_the_week: Weekday
    begin_time: datetime.time
    end_time: datetime.time


class ApplicationSectionRelatedCreateData(TypedDict):
    name: str
    num_persons: int

    reservations_begin_date: datetime.date
    reservations_end_date: datetime.date

    reservation_min_duration: datetime.timedelta
    reservation_max_duration: datetime.timedelta
    applied_reservations_per_week: int

    purpose: NotRequired[ReservationPurpose | None]
    age_group: NotRequired[AgeGroup | None]

    reservation_unit_options: list[ReservationUnitOptionRelatedCreateData]
    suitable_time_ranges: list[SuitableTimeRangeRelatedCreateData]


class ApplicationSectionRelatedUpdateData(TypedDict, total=False):
    pk: Required[int]

    name: str
    num_persons: int

    reservations_begin_date: datetime.date
    reservations_end_date: datetime.date

    reservation_min_duration: datetime.timedelta
    reservation_max_duration: datetime.timedelta
    applied_reservations_per_week: int

    purpose: ReservationPurpose | None
    age_group: AgeGroup | None

    reservation_unit_options: list[ReservationUnitOptionRelatedUpdateData]
    suitable_time_ranges: list[SuitableTimeRangeRelatedUpdateData]


class ApplicationCreateData(TypedDict):
    applicant_type: ReserveeType | None
    additional_information: str

    user: User | None
    application_round: ApplicationRound
    application_sections: list[ApplicationSectionRelatedCreateData]

    contact_person_first_name: str
    contact_person_last_name: str
    contact_person_email: str | None
    contact_person_phone_number: str

    billing_street_address: str
    billing_post_code: str
    billing_city: str

    organisation_name: str
    organisation_email: str | None
    organisation_identifier: str
    organisation_year_established: int | None
    organisation_active_members: int | None
    organisation_core_business: bool
    organisation_street_address: str
    organisation_post_code: str
    organisation_city: str
    municipality: MunicipalityChoice | None


class ApplicationUpdateData(TypedDict, total=False):
    pk: Required[int]

    applicant_type: ReserveeType | None
    additional_information: str

    application_sections: list[ApplicationSectionRelatedUpdateData]

    contact_person_first_name: str
    contact_person_last_name: str
    contact_person_email: str | None
    contact_person_phone_number: str

    billing_street_address: str
    billing_post_code: str
    billing_city: str

    organisation_name: str
    organisation_email: str | None
    organisation_identifier: str
    organisation_year_established: int | None
    organisation_active_members: int | None
    organisation_core_business: bool
    organisation_street_address: str
    organisation_post_code: str
    organisation_city: str
    municipality: MunicipalityChoice | None

    sent_at: None


class ReservationCreateData(TypedDict):
    reservation_unit: ReservationUnit
    begins_at: datetime.datetime
    ends_at: datetime.datetime


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


class ReservationAdjustTimeData(TypedDict):
    pk: int
    begins_at: datetime.datetime
    ends_at: datetime.datetime


class ReservationApproveData(TypedDict):
    pk: int
    price: Decimal
    handling_details: str


class ReservationCancelData(TypedDict):
    pk: int
    cancel_details: str
    cancel_reason: ReservationCancelReasonChoice


class ReservationDenyData(TypedDict):
    pk: int
    deny_reason: ReservationDenyReason
    handling_details: str


class ReservationWorkingMemoData(TypedDict):
    pk: int
    working_memo: str


class StaffCreateReservationData(TypedDict):
    name: NotRequired[str]
    description: NotRequired[str]
    num_persons: NotRequired[int]
    working_memo: NotRequired[str]
    type: NotRequired[ReservationTypeChoice]
    municipality: NotRequired[str | None]

    begins_at: datetime.datetime
    ends_at: datetime.datetime
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

    reservation_unit: ReservationUnit
    age_group: NotRequired[AgeGroup]
    purpose: NotRequired[ReservationPurpose]


class StaffReservationUpdateData(StaffCreateReservationData):
    pk: int


class StaffReservationAdjustTimeData(TypedDict):
    pk: int
    begins_at: datetime.datetime
    ends_at: datetime.datetime
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]


class ReservationSeriesCreateData(TypedDict):
    name: str
    description: str

    begin_time: datetime.time
    end_time: datetime.time
    begin_date: datetime.date
    end_date: datetime.date
    weekdays: list[int]
    recurrence_in_days: int

    reservation_unit: ReservationUnit
    age_group: NotRequired[AgeGroup]

    reservation_details: ReservationDetails
    check_opening_hours: NotRequired[bool]
    skip_dates: NotRequired[list[datetime.date]]


class ReservationSeriesUpdateData(TypedDict):
    pk: int
    name: NotRequired[str]
    description: NotRequired[str]

    age_group: NotRequired[AgeGroup]

    reservation_details: NotRequired[ReservationDetails]
    skip_reservations: NotRequired[list[int]]


class ReservationSeriesAddData(TypedDict):
    pk: int
    begins_at: datetime.datetime
    ends_at: datetime.datetime
    buffer_time_before: datetime.timedelta
    buffer_time_after: datetime.timedelta
    access_type: AccessType


class ReservationSeriesDenyData(TypedDict):
    pk: int
    deny_reason: ReservationDenyReason
    handling_details: str


class ReservationSeriesRescheduleData(TypedDict):
    pk: int
    begin_date: NotRequired[datetime.date]
    begin_time: NotRequired[datetime.time]
    end_date: NotRequired[datetime.date]
    end_time: NotRequired[datetime.time]
    weekdays: NotRequired[list[int]]
    buffer_time_before: NotRequired[datetime.timedelta]
    buffer_time_after: NotRequired[datetime.timedelta]
    skip_dates: NotRequired[list[datetime.date]]


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
    num_persons: int | None
    state: ReservationStateChoice
    type: ReservationTypeChoice | ReservationTypeStaffChoice
    municipality: MunicipalityChoice
    working_memo: str

    buffer_time_before: datetime.timedelta | None
    buffer_time_after: datetime.timedelta | None
    handled_at: datetime.datetime
    confirmed_at: datetime.datetime

    applying_for_free_of_charge: bool
    free_of_charge_reason: str | None

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

    user: User
    purpose: ReservationPurpose


class ReservationUnitImageCreateData(TypedDict, total=False):
    image: UploadedFile
    image_type: ReservationUnitImageType


class ReservationUnitImageUpdateData(ReservationUnitImageCreateData, total=False):
    pk: int


class ReservationUnitPricingData(TypedDict, total=False):
    is_activated_on_begins: bool
    price_unit: PriceUnit
    lowest_price: Decimal
    highest_price: Decimal
    tax_percentage: TaxPercentage


class ReservationUnitPricingCreateData(ReservationUnitPricingData, total=False):
    begins: Required[datetime.date]
    payment_type: Required[PaymentType]


class ReservationUnitPricingUpdateData(ReservationUnitPricingData, total=False):
    pk: int
    begins: datetime.date
    payment_type: PaymentType


class ReservationUnitAccessTypeCreateData(TypedDict):
    access_type: AccessType
    begin_date: datetime.date


class ReservationUnitAccessTypeUpdateData(TypedDict, total=False):
    pk: int
    access_type: AccessType
    begin_date: datetime.date


class ApplicationRoundTimeSlotCreateData(TypedDict, total=False):
    weekday: Required[Weekday]
    is_closed: bool
    reservable_times: list[TimeSlot]


class ApplicationRoundTimeSlotUpdateData(TypedDict, total=False):
    pk: int
    weekday: Weekday
    is_closed: bool
    reservable_times: list[TimeSlot]


class ReservationUnitData(TypedDict, total=False):
    name_sv: str
    name_en: str
    description_fi: str
    description_sv: str
    description_en: str
    notes_when_applying_fi: str | None
    notes_when_applying_sv: str | None
    notes_when_applying_en: str | None
    reservation_pending_instructions_fi: str
    reservation_pending_instructions_sv: str
    reservation_pending_instructions_en: str
    reservation_confirmed_instructions_fi: str
    reservation_confirmed_instructions_sv: str
    reservation_confirmed_instructions_en: str
    reservation_cancelled_instructions_fi: str
    reservation_cancelled_instructions_sv: str
    reservation_cancelled_instructions_en: str
    contact_information: str

    surface_area: int | None
    min_persons: int | None
    max_persons: int | None
    max_reservations_per_user: int | None
    reservations_min_days_before: int | None
    reservations_max_days_before: int | None

    reservation_begins_at: datetime.datetime | None
    reservation_ends_at: datetime.datetime | None
    publish_begins_at: datetime.datetime | None
    publish_ends_at: datetime.datetime | None
    min_reservation_duration: datetime.timedelta | None
    max_reservation_duration: datetime.timedelta | None
    buffer_time_before: datetime.timedelta
    buffer_time_after: datetime.timedelta

    is_draft: bool
    require_adult_reservee: bool
    require_reservation_handling: bool
    reservation_block_whole_day: bool
    can_apply_free_of_charge: bool
    allow_reservations_without_opening_hours: bool

    authentication: AuthenticationType
    reservation_start_interval: ReservationStartInterval
    reservation_kind: ReservationKind
    reservation_form: ReservationFormType

    search_terms: list[str]

    reservation_unit_type: ReservationUnitType | None
    cancellation_rule: ReservationUnitCancellationRule | None
    metadata_set: ReservationMetadataSet | None
    cancellation_terms: TermsOfUse | None
    service_specific_terms: TermsOfUse | None
    pricing_terms: TermsOfUse | None
    payment_terms: TermsOfUse | None

    spaces: list[Space]
    resources: list[Resource]
    purposes: list[Purpose]
    equipments: list[Equipment]


class ReservationUnitCreateData(ReservationUnitData, total=False):
    name_fi: Required[str]
    unit: Required[Unit]

    images: list[ReservationUnitImageCreateData]
    pricings: list[ReservationUnitPricingCreateData]
    access_types: list[ReservationUnitAccessTypeCreateData]
    application_round_time_slots: list[ApplicationRoundTimeSlotCreateData]


class ReservationUnitUpdateData(ReservationUnitData, total=False):
    name_fi: str
    is_archived: bool

    images: list[ReservationUnitImageUpdateData]
    pricings: list[ReservationUnitPricingUpdateData]
    access_types: list[ReservationUnitAccessTypeUpdateData]
    application_round_time_slots: list[ApplicationRoundTimeSlotUpdateData]


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


class error_codes(StrEnum):  # noqa: N801
    """Error codes raised in the API."""

    @staticmethod
    def _generate_next_value_(name: str, start: Any, count: int, last_values: list[Any]) -> Any:  # noqa: ARG004
        # Enum values are the same as names, not lowercased like default.
        return name

    ACCESS_TYPE_ACCESS_CODE_ON_CREATE = auto()
    ACCESS_TYPE_BEGIN_DATE_IN_PAST = auto()
    ACCESS_TYPE_CANNOT_BE_MOVED = auto()
    ACCESS_TYPE_CANNOT_CHANGE_ACTIVE = auto()
    ACCESS_TYPE_CANNOT_CHANGE_PAST = auto()
    ACCESS_TYPE_CANNOT_DELETE_LAST_WITH_FUTURE_RESERVATIONS = auto()
    ACCESS_TYPE_CANNOT_DELETE_PAST_OR_ACTIVE = auto()
    ALLOCATION_APPLICATION_STATUS_NOT_ALLOWED = auto()
    ALLOCATION_APPLIED_RESERVATIONS_PER_WEEK_EXCEEDED = auto()
    ALLOCATION_DAY_OF_THE_WEEK_NOT_SUITABLE = auto()
    ALLOCATION_DURATION_NOT_A_MULTIPLE_OF_30_MINUTES = auto()
    ALLOCATION_DURATION_TOO_LONG = auto()
    ALLOCATION_DURATION_TOO_SHORT = auto()
    ALLOCATION_NOT_IN_SUITABLE_TIME_RANGES = auto()
    ALLOCATION_NO_ALLOCATIONS_ON_THE_SAME_DAY = auto()
    ALLOCATION_OPTION_LOCKED = auto()
    ALLOCATION_OPTION_REJECTED = auto()
    ALLOCATION_OVERLAPPING_ALLOCATIONS = auto()
    ALLOCATION_SECTION_STATUS_NOT_ALLOWED = auto()
    APPLICATION_ADULT_RESERVEE_REQUIRED = auto()
    APPLICATION_APPLICANT_TYPE_MISSING = auto()
    APPLICATION_BILLING_ADDRESS_CITY_MISSING = auto()
    APPLICATION_BILLING_ADDRESS_MISSING = auto()
    APPLICATION_BILLING_ADDRESS_POST_CODE_MISSING = auto()
    APPLICATION_BILLING_ADDRESS_STREET_ADDRESS_MISSING = auto()
    APPLICATION_CONTACT_PERSON_EMAIL_MISSING = auto()
    APPLICATION_CONTACT_PERSON_FIRST_NAME_MISSING = auto()
    APPLICATION_CONTACT_PERSON_LAST_NAME_MISSING = auto()
    APPLICATION_CONTACT_PERSON_MISSING = auto()
    APPLICATION_CONTACT_PERSON_PHONE_NUMBER_MISSING = auto()
    APPLICATION_ORGANISATION_ADDRESS_CITY_MISSING = auto()
    APPLICATION_ORGANISATION_ADDRESS_MISSING = auto()
    APPLICATION_ORGANISATION_ADDRESS_POST_CODE_MISSING = auto()
    APPLICATION_ORGANISATION_ADDRESS_STREET_ADDRESS_MISSING = auto()
    APPLICATION_ORGANISATION_CORE_BUSINESS_MISSING = auto()
    APPLICATION_ORGANISATION_IDENTIFIER_MISSING = auto()
    APPLICATION_ORGANISATION_MISSING = auto()
    APPLICATION_ORGANISATION_MUNICIPALITY_MISSING = auto()
    APPLICATION_ORGANISATION_NAME_MISSING = auto()
    APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS = auto()
    APPLICATION_ROUND_NOT_HANDLED = auto()
    APPLICATION_ROUND_NOT_IN_ALLOCATION = auto()
    APPLICATION_ROUND_NOT_IN_RESULTS_SENT_STATE = auto()
    APPLICATION_ROUND_TIME_SLOTS_INVALID_DATA = auto()
    APPLICATION_ROUND_TIME_SLOTS_MISSING_WEEKDAY = auto()
    APPLICATION_ROUND_TIME_SLOTS_MULTIPLE_WEEKDAYS = auto()
    APPLICATION_SECTIONS_MAXIMUM_EXCEEDED = auto()
    APPLICATION_SECTIONS_MISSING = auto()
    APPLICATION_SECTION_AGE_GROUP_MISSING = auto()
    APPLICATION_SECTION_EMPTY_NAME = auto()
    APPLICATION_SECTION_NUM_PERSONS_ZERO = auto()
    APPLICATION_SECTION_PURPOSE_MISSING = auto()
    APPLICATION_SECTION_RESERVATION_UNIT_OPTIONS_MISSING = auto()
    APPLICATION_SECTION_SUITABLE_TIME_RANGES_MISSING = auto()
    APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_FEW = auto()
    APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_SHORT = auto()
    APPLICATION_STATUS_CANNOT_CANCEL = auto()
    APPLICATION_STATUS_CANNOT_SEND = auto()
    BANNER_NOTIFICATION_ACTIVE_PERIOD_INCORRECT = auto()
    BANNER_NOTIFICATION_MESSAGE_MISSING = auto()
    CANCELLATION_NOT_ALLOWED = auto()
    CANCELLATION_TIME_PAST = auto()
    CANNOT_REJECT_APPLICATION_OPTIONS = auto()
    CANNOT_REJECT_SECTION_OPTIONS = auto()
    CHANGES_NOT_ALLOWED = auto()
    DENY_REASON_DOES_NOT_EXIST = auto()
    ENTITY_NOT_FOUND = auto()
    EXTERNAL_SERVICE_ERROR = auto()
    HAUKI_EXPORTS_ERROR = auto()
    HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND = auto()
    HELSINKI_PROFILE_EXTERNAL_SERVICE_ERROR = auto()
    HELSINKI_PROFILE_INVALID_PARAMS = auto()
    HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED = auto()
    HELSINKI_PROFILE_PERMISSION_DENIED = auto()
    HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND = auto()
    HELSINKI_PROFILE_TOKEN_INVALID = auto()
    HELSINKI_PROFILE_USER_MISSING_PROFILE_ID = auto()
    NOT_FOUND = auto()
    ORDER_CANCELLATION_NOT_ALLOWED = auto()
    ORDER_REFUND_NOT_ALLOWED = auto()
    ORDER_STATUS_CHANGED = auto()
    OVERLAPPING_RESERVATIONS = auto()
    PINDORA_ERROR = auto()
    REQUIRED_FIELD_MISSING = auto()
    REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE = auto()
    RESERVATION_ACCESS_CODE_CHANGE_NOT_ALLOWED = auto()
    RESERVATION_ACCESS_CODE_NOT_GENERATED = auto()
    RESERVATION_APPROVING_NOT_ALLOWED = auto()
    RESERVATION_BEGIN_DATE_AFTER_END_DATE = auto()
    RESERVATION_BEGIN_IN_PAST = auto()
    RESERVATION_BEGIN_TIME_AFTER_END_TIME = auto()
    RESERVATION_CANCELLATION_NOT_ALLOWED = auto()
    RESERVATION_DENYING_NOT_ALLOWED = auto()
    RESERVATION_DURATION_INVALID = auto()
    RESERVATION_END_DATE_TOO_FAR = auto()
    RESERVATION_HAS_ENDED = auto()
    RESERVATION_MODIFICATION_NOT_ALLOWED = auto()
    RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE = auto()
    RESERVATION_NO_PAYMENT_ORDER = auto()
    RESERVATION_PRICE_CANNOT_BE_CHANGED = auto()
    RESERVATION_SERIES_ALREADY_STARTED = auto()
    RESERVATION_SERIES_HAS_ENDED = auto()
    RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS = auto()
    RESERVATION_SERIES_INVALID_START_INTERVAL = auto()
    RESERVATION_SERIES_NOT_ACCESS_CODE = auto()
    RESERVATION_SERIES_NOT_OPEN = auto()
    RESERVATION_SERIES_NO_FUTURE_RESERVATIONS = auto()
    RESERVATION_SERIES_NO_RESERVATION = auto()
    RESERVATION_SERIES_OVERLAPS = auto()
    RESERVATION_SERIES_SHOULD_NOT_HAVE_ACTIVE_ACCESS_CODE = auto()
    RESERVATION_STATE_CHANGE_NOT_ALLOWED = auto()
    RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL = auto()
    RESERVATION_TYPE_NOT_ALLOWED = auto()
    RESERVATION_UNITS_MAX_DURATION_EXCEEDED = auto()
    RESERVATION_UNIT_ACCESS_TYPE_DUPLICATE_DATE = auto()
    RESERVATION_UNIT_ACCESS_TYPE_MISSING = auto()
    RESERVATION_UNIT_ACCESS_TYPE_START_DATE_INVALID = auto()
    RESERVATION_UNIT_ADULT_RESERVEE_REQUIRED = auto()
    RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED = auto()
    RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS = auto()
    RESERVATION_UNIT_HAS_NO_ACCESS_TYPE = auto()
    RESERVATION_UNIT_IN_OPEN_ROUND = auto()
    RESERVATION_UNIT_MAX_DURATION_EXCEEDED = auto()
    RESERVATION_UNIT_MAX_NUMBER_OF_RESERVATIONS_EXCEEDED = auto()
    RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID = auto()
    RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED = auto()
    RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID = auto()
    RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS = auto()
    RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID = auto()
    RESERVATION_UNIT_MISSING_ACCESS_TYPE = auto()
    RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE = auto()
    RESERVATION_UNIT_MISSING_BEGIN_DATE = auto()
    RESERVATION_UNIT_MISSING_PAYMENT_ACCOUNTING = auto()
    RESERVATION_UNIT_MISSING_PAYMENT_PRODUCT = auto()
    RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE = auto()
    RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES = auto()
    RESERVATION_UNIT_MISSING_TRANSLATIONS = auto()
    RESERVATION_UNIT_NOT_DIRECT_BOOKABLE = auto()
    RESERVATION_UNIT_NOT_FOUND_IN_PINDORA = auto()
    RESERVATION_UNIT_NOT_RESERVABLE = auto()
    RESERVATION_UNIT_NO_ACTIVE_PRICING = auto()
    RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE = auto()
    RESERVATION_UNIT_PRICINGS_INVALID_PRICES = auto()
    RESERVATION_UNIT_PRICINGS_MISSING = auto()
    RESERVATION_UNIT_PRICINGS_MISSING_BEGIN_DATE = auto()
    RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING = auto()
    RESERVATION_UNIT_PRICING_BEGIN_DATE_IN_PAST = auto()
    RESERVATION_UNIT_PRICING_CANNOT_CHANGE_ACTIVE = auto()
    RESERVATION_UNIT_PRICING_CANNOT_CHANGE_PAST = auto()
    RESERVATION_UNIT_PRICING_NO_PAYMENT_TYPE = auto()
    RESERVATION_WRONG_ACCESS_TYPE = auto()
    UPSTREAM_CALL_FAILED = auto()
    USER_NOT_INTERNAL_USER = auto()
    USER_NOT_OF_AGE = auto()
