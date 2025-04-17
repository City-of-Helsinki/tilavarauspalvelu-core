# This file should contain all possible error codes that can be returned by the GraphQL API (WIP)
# Do not put anything else but error codes in this file, so that the error codes can be used like this:
#
# from tilavarauspalvelu.api.graphql.extensions import error_codes
#
# error_codes.ERROR_CODE_NAME
#
from __future__ import annotations

ACCESS_TYPE_ACCESS_CODE_ON_CREATE = "ACCESS_TYPE_ACCESS_CODE_ON_CREATE"
ACCESS_TYPE_BEGIN_DATE_IN_PAST = "RESERVATION_UNIT_ACCESS_TYPE_BEGIN_DATE_IN_PAST"
ACCESS_TYPE_CANNOT_BE_MOVED = "RESERVATION_UNIT_ACCESS_TYPE_CANNOT_BE_MOVED"
ACCESS_TYPE_CANNOT_DELETE_LAST_WITH_FUTURE_RESERVATIONS = "ACCESS_TYPE_CANNOT_DELETE_LAST_WITH_FUTURE_RESERVATIONS"
ACCESS_TYPE_CANNOT_DELETE_PAST_OR_ACTIVE = "RESERVATION_UNIT_ACCESS_TYPE_CANNOT_DELETE_PAST_OR_ACTIVE"
ALLOCATION_APPLICATION_STATUS_NOT_ALLOWED = "ALLOCATION_APPLICATION_STATUS_NOT_ALLOWED"
ALLOCATION_APPLIED_RESERVATIONS_PER_WEEK_EXCEEDED = "ALLOCATION_APPLIED_RESERVATIONS_PER_WEEK_EXCEEDED"
ALLOCATION_DAY_OF_THE_WEEK_NOT_SUITABLE = "ALLOCATION_DAY_OF_THE_WEEK_NOT_SUITABLE"
ALLOCATION_DURATION_NOT_A_MULTIPLE_OF_30_MINUTES = "ALLOCATION_DURATION_NOT_A_MULTIPLE_OF_30_MINUTES"
ALLOCATION_DURATION_TOO_LONG = "ALLOCATION_DURATION_TOO_LONG"
ALLOCATION_DURATION_TOO_SHORT = "ALLOCATION_DURATION_TOO_SHORT"
ALLOCATION_NO_ALLOCATIONS_ON_THE_SAME_DAY = "ALLOCATION_NO_ALLOCATIONS_ON_THE_SAME_DAY"
ALLOCATION_NOT_IN_SUITABLE_TIME_RANGES = "ALLOCATION_NOT_IN_SUITABLE_TIME_RANGES"
ALLOCATION_OPTION_LOCKED = "ALLOCATION_OPTION_LOCKED"
ALLOCATION_OPTION_REJECTED = "ALLOCATION_OPTION_REJECTED"
ALLOCATION_OVERLAPPING_ALLOCATIONS = "ALLOCATION_OVERLAPPING_ALLOCATIONS"
ALLOCATION_SECTION_STATUS_NOT_ALLOWED = "ALLOCATION_SECTION_STATUS_NOT_ALLOWED"
APPLICATION_ADULT_RESERVEE_REQUIRED = "APPLICATION_ADULT_RESERVEE_REQUIRED"
APPLICATION_APPLICANT_TYPE_MISSING = "APPLICATION_APPLICANT_TYPE_MISSING"
APPLICATION_BILLING_ADDRESS_CITY_MISSING = "APPLICATION_BILLING_ADDRESS_CITY_MISSING"
APPLICATION_BILLING_ADDRESS_MISSING = "APPLICATION_BILLING_ADDRESS_MISSING"
APPLICATION_BILLING_ADDRESS_POST_CODE_MISSING = "APPLICATION_BILLING_ADDRESS_POST_CODE_MISSING"
APPLICATION_BILLING_ADDRESS_STREET_ADDRESS_MISSING = "APPLICATION_BILLING_ADDRESS_STREET_ADDRESS_MISSING"
APPLICATION_CONTACT_PERSON_EMAIL_MISSING = "APPLICATION_CONTACT_PERSON_EMAIL_MISSING"
APPLICATION_CONTACT_PERSON_FIRST_NAME_MISSING = "APPLICATION_CONTACT_PERSON_FIRST_NAME_MISSING"
APPLICATION_CONTACT_PERSON_LAST_NAME_MISSING = "APPLICATION_CONTACT_PERSON_LAST_NAME_MISSING"
APPLICATION_CONTACT_PERSON_MISSING = "APPLICATION_CONTACT_PERSON_MISSING"
APPLICATION_CONTACT_PERSON_PHONE_NUMBER_MISSING = "APPLICATION_CONTACT_PERSON_PHONE_NUMBER_MISSING"
APPLICATION_ORGANISATION_ADDRESS_CITY_MISSING = "APPLICATION_ORGANISATION_ADDRESS_CITY_MISSING"
APPLICATION_ORGANISATION_ADDRESS_MISSING = "APPLICATION_ORGANISATION_ADDRESS_MISSING"
APPLICATION_ORGANISATION_ADDRESS_POST_CODE_MISSING = "APPLICATION_ORGANISATION_ADDRESS_POST_CODE_MISSING"
APPLICATION_ORGANISATION_ADDRESS_STREET_ADDRESS_MISSING = "APPLICATION_ORGANISATION_ADDRESS_STREET_ADDRESS_MISSING"
APPLICATION_ORGANISATION_CORE_BUSINESS_MISSING = "APPLICATION_ORGANISATION_CORE_BUSINESS_MISSING"
APPLICATION_ORGANISATION_HOME_CITY_MISSING = "APPLICATION_ORGANISATION_HOME_CITY_MISSING"
APPLICATION_ORGANISATION_IDENTIFIER_MISSING = "APPLICATION_ORGANISATION_IDENTIFIER_MISSING"
APPLICATION_ORGANISATION_MISSING = "APPLICATION_ORGANISATION_MISSING"
APPLICATION_ORGANISATION_NAME_MISSING = "APPLICATION_ORGANISATION_NAME_MISSING"
APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS = "APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS"
APPLICATION_ROUND_NOT_HANDLED = "APPLICATION_ROUND_NOT_HANDLED"
APPLICATION_ROUND_NOT_IN_ALLOCATION = "APPLICATION_ROUND_NOT_IN_ALLOCATION"
APPLICATION_ROUND_NOT_IN_RESULTS_SENT_STATE = "APPLICATION_ROUND_NOT_IN_RESULTS_SENT_STATE"
APPLICATION_SECTION_AGE_GROUP_MISSING = "APPLICATION_SECTION_AGE_GROUP_MISSING"
APPLICATION_SECTION_EMPTY_NAME = "APPLICATION_SECTION_EMPTY_NAME"
APPLICATION_SECTION_NUM_PERSONS_ZERO = "APPLICATION_SECTION_NUM_PERSONS_ZERO"
APPLICATION_SECTION_PURPOSE_MISSING = "APPLICATION_SECTION_PURPOSE_MISSING"
APPLICATION_SECTION_RESERVATION_UNIT_OPTIONS_MISSING = "APPLICATION_SECTION_RESERVATION_UNIT_OPTIONS_MISSING"
APPLICATION_SECTION_SUITABLE_TIME_RANGES_MISSING = "APPLICATION_SECTION_SUITABLE_TIME_RANGES_MISSING"
APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_FEW = "APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_FEW"
APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_SHORT = "APPLICATION_SECTION_SUITABLE_TIME_RANGES_TOO_SHORT"
APPLICATION_SECTIONS_MAXIMUM_EXCEEDED = "APPLICATION_SECTIONS_MAXIMUM_EXCEEDED"
APPLICATION_SECTIONS_MISSING = "APPLICATION_SECTIONS_MISSING"
APPLICATION_STATUS_CANNOT_CANCEL = "APPLICATION_STATUS_CANNOT_CANCEL"
APPLICATION_STATUS_CANNOT_SEND = "APPLICATION_STATUS_CANNOT_SEND"
CANCEL_REASON_DOES_NOT_EXIST = "CANCEL_REASON_DOES_NOT_EXIST"
CANCELLATION_NOT_ALLOWED = "CANCELLATION_NOT_ALLOWED"
CANCELLATION_TIME_PAST = "CANCELLATION_TIME_PAST"
CANNOT_REJECT_APPLICATION_OPTIONS = "CANNOT_REJECT_APPLICATION_OPTIONS"
CANNOT_REJECT_SECTION_OPTIONS = "CANNOT_REJECT_SECTION_OPTIONS"
CHANGES_NOT_ALLOWED = "CHANGES_NOT_ALLOWED"
DENY_REASON_DOES_NOT_EXIST = "DENY_REASON_DOES_NOT_EXIST"
ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND"
EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
HAUKI_EXPORTS_ERROR = "HAUKI_EXPORTS_ERROR"
HELSINKI_PROFILE_APPLICATION_USER_MISSING = "HELSINKI_PROFILE_APPLICATION_USER_MISSING"
HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND = "HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND"
HELSINKI_PROFILE_INVALID_PARAMS = "HELSINKI_PROFILE_INVALID_PARAMS"
HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED = "HELSINKI_PROFILE_KEYCLOAK_REFRESH_TOKEN_EXPIRED"  # noqa: S105 # nosec # NOSONAR
HELSINKI_PROFILE_RESERVATION_USER_MISSING = "HELSINKI_PROFILE_RESERVATION_USER_MISSING"
HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND = "HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND"
HELSINKI_PROFILE_TOKEN_INVALID = "HELSINKI_PROFILE_TOKEN_INVALID"  # noqa: S105 # nosec # NOSONAR
HELSINKI_PROFILE_USER_MISSING_PROFILE_ID = "HELSINKI_PROFILE_USER_MISSING_PROFILE_ID"
MULTIPLE_RESERVATION_UNITS = "MULTIPLE_RESERVATION_UNITS"
NOT_FOUND = "NOT_FOUND"
OVERLAPPING_RESERVATIONS = "OVERLAPPING_RESERVATIONS"
PINDORA_ERROR = "PINDORA_ERROR"
REFUND_NOT_ALLOWED = "REFUND_NOT_ALLOWED"
REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING"
REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE = "REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE"
RESERVATION_ACCESS_CODE_CHANGE_NOT_ALLOWED = "RESERVATION_ACCESS_CODE_CHANGE_NOT_ALLOWED"
RESERVATION_ACCESS_CODE_NOT_GENERATED = "RESERVATION_ACCESS_CODE_NOT_GENERATED"
RESERVATION_APPROVING_NOT_ALLOWED = "RESERVATION_APPROVING_NOT_ALLOWED"
RESERVATION_BEGIN_DATE_AFTER_END_DATE = "RESERVATION_BEGIN_DATE_AFTER_END_DATE"
RESERVATION_BEGIN_IN_PAST = "RESERVATION_BEGIN_IN_PAST"
RESERVATION_BEGIN_TIME_AFTER_END_TIME = "RESERVATION_BEGIN_TIME_AFTER_END_TIME"
RESERVATION_CANCELLATION_NOT_ALLOWED = "RESERVATION_CANCELLATION_NOT_ALLOWED"
RESERVATION_DENYING_NOT_ALLOWED = "RESERVATION_DENYING_NOT_ALLOWED"
RESERVATION_DURATION_INVALID = "RESERVATION_DURATION_INVALID"
RESERVATION_END_DATE_TOO_FAR = "RESERVATION_END_DATE_TOO_FAR"
RESERVATION_HAS_ENDED = "RESERVATION_HAS_ENDED"
RESERVATION_MODIFICATION_NOT_ALLOWED = "RESERVATION_MODIFICATION_NOT_ALLOWED"
RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE = "RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE"
RESERVATION_SERIES_ALREADY_STARTED = "RESERVATION_SERIES_ALREADY_STARTED"
RESERVATION_SERIES_HAS_ENDED = "RESERVATION_SERIES_HAS_ENDED"
RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS = " RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS"
RESERVATION_SERIES_INVALID_START_INTERVAL = "RESERVATION_SERIES_INVALID_START_INTERVAL"
RESERVATION_SERIES_INVALID_WEEKDAY = "RESERVATION_SERIES_INVALID_WEEKDAY"
RESERVATION_SERIES_NO_FUTURE_RESERVATIONS = "RESERVATION_SERIES_NO_FUTURE_RESERVATIONS"
RESERVATION_SERIES_NO_RESERVATION = "RESERVATION_SERIES_NO_RESERVATION"
RESERVATION_SERIES_NOT_ACCESS_CODE = "RESERVATION_SERIES_NOT_ACCESS_CODE"
RESERVATION_SERIES_NOT_OPEN = "RESERVATION_SERIES_NOT_OPEN"
RESERVATION_SERIES_OVERLAPS = "RESERVATION_SERIES_OVERLAPS"
RESERVATION_SERIES_SHOULD_NOT_HAVE_ACTIVE_ACCESS_CODE = "RESERVATION_SERIES_SHOULD_NOT_HAVE_ACTIVE_ACCESS_CODE"
RESERVATION_STATE_CHANGE_NOT_ALLOWED = "RESERVATION_STATE_CHANGE_NOT_ALLOWED"
RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL = "RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL"
RESERVATION_TYPE_NOT_ALLOWED = "RESERVATION_TYPE_NOT_ALLOWED"
RESERVATION_UNIT_ACCESS_TYPE_START_DATE_INVALID = "RESERVATION_UNIT_ACCESS_TYPE_START_DATE_INVALID"
RESERVATION_UNIT_ADULT_RESERVEE_REQUIRED = "RESERVATION_UNIT_ADULT_RESERVEE_REQUIRED"
RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED = "RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED"
RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS = "RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS"
RESERVATION_UNIT_HAS_NO_ACCESS_TYPE = "RESERVATION_UNIT_HAS_NO_ACCESS_TYPE"
RESERVATION_UNIT_IN_OPEN_ROUND = "RESERVATION_UNIT_IN_OPEN_ROUND"
RESERVATION_UNIT_MAX_NUMBER_OF_RESERVATIONS_EXCEEDED = "RESERVATION_UNIT_MAX_NUMBER_OF_RESERVATIONS_EXCEEDED"
RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID = "RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID"
RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED = "RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED"
RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID = "RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID"
RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS = "RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS"
RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID = "RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID"
RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE = "RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE"
RESERVATION_UNIT_MISSING_PAYMENT_ACCOUNTING = "RESERVATION_UNIT_MISSING_PAYMENT_ACCOUNTING"
RESERVATION_UNIT_MISSING_PAYMENT_PRODUCT = "RESERVATION_UNIT_MISSING_PAYMENT_PRODUCT"
RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE = "RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE"
RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES = "RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES"
RESERVATION_UNIT_MISSING_TRANSLATIONS = "RESERVATION_UNIT_MISSING_TRANSLATIONS"
RESERVATION_UNIT_NO_ACTIVE_PRICING = "RESERVATION_UNIT_NO_ACTIVE_PRICING"
RESERVATION_UNIT_NOT_DIRECT_BOOKABLE = "RESERVATION_UNIT_NOT_DIRECT_BOOKABLE"
RESERVATION_UNIT_NOT_RESERVABLE = "RESERVATION_UNIT_NOT_RESERVABLE"
RESERVATION_UNIT_PRICING_NO_PAYMENT_TYPE = "RESERVATION_UNIT_PRICING_NO_PAYMENT_TYPE"
RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE = "RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE"
RESERVATION_UNIT_PRICINGS_INVALID_PRICES = "RESERVATION_UNIT_PRICINGS_INVALID_PRICES"
RESERVATION_UNIT_PRICINGS_MISSING = "RESERVATION_UNIT_PRICINGS_MISSING"
RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING = "RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING"
RESERVATION_UNITS_MAX_DURATION_EXCEEDED = "RESERVATION_UNITS_MAX_DURATION_EXCEEDED"
RESERVATION_WRONG_ACCESS_TYPE = "RESERVATION_WRONG_ACCESS_TYPE"
UPSTREAM_CALL_FAILED = "UPSTREAM_CALL_FAILED"
USER_NOT_OF_AGE = "USER_NOT_OF_AGE"
