from __future__ import annotations

from string import Formatter
from typing import Any

from utils.external_service.errors import ExternalServiceError

__all__ = [
    "PindoraAPIError",
    "PindoraBadRequestError",
    "PindoraClientConfigurationError",
    "PindoraClientError",
    "PindoraConflictError",
    "PindoraInvalidValueError",
    "PindoraMissingKeyError",
    "PindoraNotFoundError",
    "PindoraPermissionError",
    "PindoraUnexpectedResponseError",
]


class PindoraClientError(ExternalServiceError):
    """Error in Pindora client, not related to the API"""

    msg: str = "Pindora client error"
    error_formatter: Formatter = Formatter()

    def __init__(self, msg: str = "", /, **kwargs: Any) -> None:
        msg = msg or self.msg
        if kwargs:
            msg = self.error_formatter.format(msg, **kwargs)
        super().__init__(msg)


class PindoraClientConfigurationError(PindoraClientError):
    """Pindora API settings are not configured correctly"""

    msg = "'{config}' setting must to be configured for Pindora client to work."


class PindoraAPIError(PindoraClientError):
    """Error in Pindora API"""


class PindoraBadRequestError(PindoraAPIError):
    """Bad request to Pindora API"""

    msg = "Invalid Pindora API request: {text}."


class PindoraPermissionError(PindoraAPIError):
    """Permission error in Pindora API"""

    msg = "Pindora API key is invalid."


class PindoraNotFoundError(PindoraAPIError):
    """Entity was not found in Pindora"""

    msg = "{entity} '{uuid}' not found from Pindora."


class PindoraConflictError(PindoraAPIError):
    """Conflict when mutating entity in Pindora"""

    msg = "{entity} '{uuid}' already exists in Pindora."


class PindoraUnexpectedResponseError(PindoraAPIError):
    """An unexpected response was received from Pindora"""

    msg = "Unexpected response from Pindora when {action} '{uuid}': [{status_code}] {text}"


class PindoraMissingKeyError(PindoraAPIError):
    """Missing key in response JSON"""

    msg = "Missing key in {entity} response from Pindora: {key}"


class PindoraInvalidValueError(PindoraAPIError):
    """Invalid value in response JSON"""

    msg = "Invalid value in {entity} response from Pindora: {error}"
