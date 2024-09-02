# This file should contain all possible error codes that can be returned by the GraphQL API (WIP)
# Do not put anything else but error codes in this file, so that the error codes can be used like this:
#
# from api.graphql.extensions import error_codes
#
# error_codes.ERROR_CODE_NAME
#

REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING"
ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND"

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

RESERVATION_UNIT_MISSING_TRANSLATIONS = "RESERVATION_UNIT_MISSING_TRANSLATIONS"
RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES = "RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES"
RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE = "RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE"
RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS = "RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS"
RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID = "RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID"
RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID = "RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID"
RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID = "RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID"
RESERVATION_UNIT_PRICINGS_MISSING = "RESERVATION_UNIT_PRICINGS_MISSING"
RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING = "RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING"
RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE = "RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE"
RESERVATION_UNIT_PRICINGS_INVALID_PRICES = "RESERVATION_UNIT_PRICINGS_INVALID_PRICES"


HELSINKI_PROFILE_TOKEN_INVALID = "HELSINKI_PROFILE_TOKEN_INVALID"  # noqa: S105 # nosec # NOSONAR
HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND = "HELSINKI_PROFILE_RESERVATION_USER_NOT_FOUND"
HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND = "HELSINKI_PROFILE_APPLICATION_USER_NOT_FOUND"
HELSINKI_PROFILE_RESERVATION_USER_MISSING = "HELSINKI_PROFILE_RESERVATION_USER_MISSING"
HELSINKI_PROFILE_APPLICATION_USER_MISSING = "HELSINKI_PROFILE_APPLICATION_USER_MISSING"
HELSINKI_PROFILE_USER_MISSING_PROFILE_ID = "HELSINKI_PROFILE_USER_MISSING_PROFILE_ID"

CANNOT_REJECT_SECTION_OPTIONS = "CANNOT_REJECT_SECTION_OPTIONS"
CANNOT_REJECT_APPLICATION_OPTIONS = "CANNOT_REJECT_APPLICATION_OPTIONS"

RESERVATION_STATE_CHANGE_NOT_ALLOWED = "RESERVATION_STATE_CHANGE_NOT_ALLOWED"
RESERVATION_DENYING_NOT_ALLOWED = "RESERVATION_DENYING_NOT_ALLOWED"
RESERVATION_APPROVING_NOT_ALLOWED = "RESERVATION_APPROVING_NOT_ALLOWED"
RESERVATION_CANCELLATION_NOT_ALLOWED = "RESERVATION_CANCELLATION_NOT_ALLOWED"
RESERVATION_REQUIRES_MANUAL_HANDLING = "RESERVATION_REQUIRES_MANUAL_HANDLING"

RESERVATION_BEGIN_DATE_AFTER_END_DATE = "RESERVATION_BEGIN_DATE_AFTER_END_DATE"
RESERVATION_BEGIN_TIME_AFTER_END_TIME = "RESERVATION_BEGIN_TIME_AFTER_END_TIME"
RESERVATION_END_DATE_TOO_FAR = "RESERVATION_END_DATE_TOO_FAR"
RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL = "RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL"

RESERVATION_SERIES_OVERLAPS = "RESERVATION_SERIES_OVERLAPS"
RESERVATION_SERIES_NOT_OPEN = "RESERVATION_SERIES_NOT_OPEN"
RESERVATION_SERIES_INVALID_START_INTERVAL = "RESERVATION_SERIES_INVALID_START_INTERVAL"
RESERVATION_SERIES_INVALID_WEEKDAY = "RESERVATION_SERIES_INVALID_WEEKDAY"
RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS = " RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS"

APPLICATION_ROUND_NOT_IN_ALLOCATION = "APPLICATION_ROUND_NOT_IN_ALLOCATION"
APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS = "APPLICATION_ROUND_HAS_UNHANDLED_APPLICATIONS"
