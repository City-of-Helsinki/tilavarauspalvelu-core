from enum import Enum

from graphql.error import GraphQLError


class ValidationErrorCodes(Enum):
    RESERVATION_UNIT_NOT_RESERVABLE = "RESERVATION_UNIT_NOT_RESERVABLE"
    OVERLAPPING_RESERVATIONS = "OVERLAPPING_RESERVATIONS"
    RESERVATION_UNIT_IS_NOT_OPEN = "RESERVATION_UNIT_IS_NOT_OPEN"
    RESERVATION_UNIT_IN_OPEN_ROUND = "RESERVATION_UNIT_IN_OPEN_ROUND"
    RESERVATION_UNITS_MAX_DURATION_EXCEEDED = "RESERVATION_UNITS_MAX_DURATION_EXCEEDED"
    RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED = "RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED"
    AMBIGUOUS_SKU = "AMBIGUOUS_SKU"
    MAX_NUMBER_OF_ACTIVE_RESERVATIONS_EXCEEDED = "MAX_NUMBER_OF_ACTIVE_RESERVATIONS_EXCEEDED"
    RESERVATION_OVERLAP = "RESERVATION_OVERLAP"
    RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL = "RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL"
    RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE = "RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE"
    RESERVATION_MODIFICATION_NOT_ALLOWED = "RESERVATION_MODIFICATION_NOT_ALLOWED"
    RESERVATION_BEGIN_IN_PAST = "RESERVATION_BEGIN_IN_PAST"
    RESERVATION_CURRENT_BEGIN_IN_PAST = "RESERVATION_CURRENT_BEGIN_IN_PAST"
    RESERVATION_BEGIN_AFTER_END = "RESERVATION_BEGIN_AFTER_END"
    RESERVATION_UNIT_TYPE_IS_SEASON = "RESERVATION_UNIT_TYPE_IS_SEASON"
    NO_PERMISSION = "NO_PERMISSION"
    CHANGES_NOT_ALLOWED = "CHANGES_NOT_ALLOWED"
    STATE_CHANGE_NOT_ALLOWED = "STATE_CHANGE_NOT_ALLOWED"
    CANCELLATION_NOT_ALLOWED = "CANCELLATION_NOT_ALLOWED"
    CANCELLATION_TIME_PAST = "CANCELLATION_TIME_PAST"
    DENYING_NOT_ALLOWED = "DENYING_NOT_ALLOWED"
    APPROVING_NOT_ALLOWED = "APPROVING_NOT_ALLOWED"
    REFUND_NOT_ALLOWED = "REFUND_NOT_ALLOWED"
    REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING"
    REQUIRES_MANUAL_HANDLING = "REQUIRES_MANUAL_HANDLING"
    REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE = "REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE"
    MULTIPLE_RESERVATION_UNITS = "MULTIPLE_RESERVATION_UNITS"
    INVALID_PAYMENT_TYPE = "INVALID_PAYMENT_TYPE"
    MISSING_PAYMENT_PRODUCT = "MISSING_PAYMENT_PRODUCT"
    UPSTREAM_CALL_FAILED = "UPSTREAM_CALL_FAILED"
    NOT_FOUND = "NOT_FOUND"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    INVALID_WEEKDAY = "INVALID_WEEKDAY"
    INVALID_RECURRENCE_IN_DAY = "INVALID_RECURRENCE_IN_DAYS"
    RESERVATION_TYPE_NOT_ALLOWED = "RESERVATION_TYPE_NOT_ALLOWED"


class ValidationErrorWithCode(GraphQLError):
    def __init__(
        self,
        message: str,
        error_code: ValidationErrorCodes,
        field: str | None = None,
    ) -> None:
        super().__init__(message, None, None, None, None, None)
        self.extensions = {
            "error_code": error_code.value,
            "field": field or "nonFieldError",
        }
