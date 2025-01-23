from __future__ import annotations

from string import Formatter
from typing import Any

from utils.external_service.errors import ExternalServiceError

__all__ = [
    "PindoraAPIError",
    "PindoraClientConfigurationError",
    "PindoraClientError",
    "PindoraUnexpectedResponseError",
]


class PindoraClientError(ExternalServiceError):
    """Error in Pindora client, not related to the API"""

    msg: str = "Pindora client error"
    error_formatter: Formatter = Formatter()

    def __init__(self, msg: str = "", /, **kwargs: Any) -> None:
        msg = self.error_formatter.format(msg or self.msg, **kwargs)
        super().__init__(msg)


class PindoraClientConfigurationError(PindoraClientError):
    """Pindora API settings are not configured correctly"""

    msg = "'{config}' setting must to be configured for Pindora client to work."


class PindoraAPIError(PindoraClientError):
    """Error in Pindora API"""


class PindoraUnexpectedResponseError(PindoraAPIError):
    """Error when an unexpected response was received from Pindora"""

    msg = "Unexpected response from Pindora when {action} '{uuid}': [{status_code}] {text}"
