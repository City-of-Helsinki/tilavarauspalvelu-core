from __future__ import annotations

from typing import TYPE_CHECKING

from tilavarauspalvelu.integrations.sentry import SentryLogger

if TYPE_CHECKING:
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
