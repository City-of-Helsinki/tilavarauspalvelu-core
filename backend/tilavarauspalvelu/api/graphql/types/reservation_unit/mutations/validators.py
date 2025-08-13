import datetime

from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import ReservationStartInterval
from tilavarauspalvelu.models import Resource, Space
from tilavarauspalvelu.typing import error_codes

__all__ = [
    "validate_reservation_duration",
]


def validate_reservation_duration(
    min_reservation_duration: datetime.timedelta | None,
    max_reservation_duration: datetime.timedelta | None,
    reservation_start_interval: ReservationStartInterval | None,
) -> None:
    if (
        min_reservation_duration is not None
        and max_reservation_duration is not None
        and min_reservation_duration > max_reservation_duration
    ):
        msg = "'minReservationDuration' can't be greater than 'maxReservationDuration'"
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID)

    if reservation_start_interval is None:
        return

    interval_minutes = reservation_start_interval.as_number

    if min_reservation_duration is not None:
        min_duration_minutes = min_reservation_duration.total_seconds() // 60
        if min_duration_minutes < interval_minutes:
            msg = "'minReservationDuration' must be at least the 'reservationStartInterval'"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID)

        if min_duration_minutes % interval_minutes != 0:
            msg = "'minReservationDuration' must be a multiple of the 'reservationStartInterval'"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID)

    if max_reservation_duration is not None:
        max_duration_minutes = max_reservation_duration.total_seconds() // 60
        if max_duration_minutes < interval_minutes:
            msg = "'maxReservationDuration' must be at least the 'reservationStartInterval'"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID)

        if max_duration_minutes % interval_minutes != 0:
            msg = "'maxReservationDuration' must be a multiple of the 'reservationStartInterval'"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID)


def validate_for_publish(
    spaces: list[Space],
    resources: list[Resource],
    reservation_unit_type: int | None,
    min_persons: int | None,
    max_persons: int | None,
) -> None:
    if not (spaces or resources):
        msg = "Not-draft state reservation unit must have one or more space or resource defined"
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES)

    if not reservation_unit_type:
        msg = "Not-draft reservation unit must have a reservation unit type"
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE)

    if min_persons is not None and max_persons is not None and min_persons > max_persons:
        msg = "'minPersons' can't be more than 'maxPersons'"
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS)


def validate_translations(  # noqa: PLR0917
    name_fi: str | None,
    name_sv: str | None,
    name_en: str | None,
    description_fi: str | None,
    description_sv: str | None,
    description_en: str | None,
) -> None:
    if not name_fi or name_fi.isspace():
        msg = "Not-draft reservation unit must have a name in finnish."
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)

    if not name_sv or name_sv.isspace():
        msg = "Not-draft reservation unit must have a name in swedish."
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)

    if not name_en or name_en.isspace():
        msg = "Not-draft reservation unit must have a name in english."
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)

    if not description_fi or description_fi.isspace():
        msg = "Not-draft reservation unit must have a description in finnish."
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)

    if not description_sv or description_sv.isspace():
        msg = "Not-draft reservation unit must have a description in swedish."
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)

    if not description_en or description_en.isspace():
        msg = "Not-draft reservation unit must have a description in english."
        raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)
