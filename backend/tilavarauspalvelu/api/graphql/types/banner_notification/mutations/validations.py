import datetime

from undine.exceptions import GraphQLErrorGroup, GraphQLValidationError

from tilavarauspalvelu.typing import ErrorList, error_codes

__all__ = [
    "validate_banner_notification",
]


def validate_banner_notification(
    message: str,
    draft: bool,  # noqa: FBT001
    active_from: datetime.datetime | None,
    active_until: datetime.datetime | None,
) -> None:
    errors: ErrorList = []

    both_set = isinstance(active_from, datetime.datetime) and isinstance(active_until, datetime.datetime)
    both_null = active_from is None and active_until is None

    if not (both_set or both_null):
        msg = "Both 'activeFrom' and 'activeUntil' must be either set or null."
        error = GraphQLValidationError(msg, code=error_codes.BANNER_NOTIFICATION_ACTIVE_PERIOD_INCORRECT)
        errors.append(error)

    if both_set and active_from >= active_until:
        msg = "'activeFrom' must be before 'activeUntil'."
        error = GraphQLValidationError(msg, code=error_codes.BANNER_NOTIFICATION_ACTIVE_PERIOD_INCORRECT)
        errors.append(error)

    if not draft:
        if not active_from:
            msg = "Non-draft notifications must set 'activeFrom'"
            error = GraphQLValidationError(msg, code=error_codes.BANNER_NOTIFICATION_ACTIVE_PERIOD_INCORRECT)
            errors.append(error)

        if not active_until:
            msg = "Non-draft notifications must set 'activeUntil'"
            error = GraphQLValidationError(msg, code=error_codes.BANNER_NOTIFICATION_ACTIVE_PERIOD_INCORRECT)
            errors.append(error)

        if not message:
            msg = "Non-draft notifications must have a message."
            error = GraphQLValidationError(msg, code=error_codes.BANNER_NOTIFICATION_MESSAGE_MISSING)
            errors.append(error)

    if errors:
        raise GraphQLErrorGroup(errors)
