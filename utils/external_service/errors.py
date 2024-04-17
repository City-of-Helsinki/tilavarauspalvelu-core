import json
from typing import Any

from requests import Response

from utils.sentry import SentryLogger


class ExternalServiceError(Exception):
    """Base class for exceptions related to external services."""

    def __init__(self, msg: str, /, *, details: dict[str, Any] | None = None) -> None:
        self.details = details
        super().__init__(msg)

    def __str__(self) -> str:
        base = super().__str__()
        if self.details is not None:
            return f"{base} {json.dumps(self.details)}"
        return base


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
