from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.integrations.sentry import SentryLogger

if TYPE_CHECKING:
    from collections.abc import Generator

    from requests import Response


class ExternalServiceError(Exception):
    """Base class for exceptions related to external services."""


class ExternalServiceRequestError(ExternalServiceError):
    """Exception for when a request to an external service fails with a 5xx status code."""

    def __init__(self, response: Response, service_name: str) -> None:
        error_message = (
            f"{response.request.method.upper()} request to {service_name.upper()} ({response.url}) "
            f"failed with status {response.status_code}."
        )

        # Log the response body to Sentry
        SentryLogger.log_message(
            f"{service_name.capitalize()}: {error_message}",
            details=f"Response body: {response.text}",
            level="error",
        )

        super().__init__(error_message)


class ExternalServiceParseJSONError(ExternalServiceError):
    """Exception for when parsing a JSON response from an external service fails."""


@contextlib.contextmanager
def external_service_errors_as_validation_errors(*, code: str) -> Generator[None]:
    try:
        yield
    except ExternalServiceError as error:
        raise ValidationError(str(error), code=code) from error
