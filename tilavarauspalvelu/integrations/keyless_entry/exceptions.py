from __future__ import annotations

from string import Formatter
from typing import Any

from utils.external_service.errors import ExternalServiceError

__all__ = [
    "PindoraAPIConfigurationError",
    "PindoraAPIError",
]


class PindoraAPIError(ExternalServiceError):
    """Error in Pindora API"""

    msg: str = "Pindora API error"
    error_formatter: Formatter = Formatter()

    def __init__(self, msg: str = "", /, **kwargs: Any) -> None:
        msg = self.error_formatter.format(msg or self.msg, **kwargs)
        super().__init__(msg)


class PindoraAPIConfigurationError(PindoraAPIError):
    """Pindora API settings are not configured correctly"""

    msg = "'{config}' setting must to be configured for Pindora client to work."


class PindoraUnexpectedResponseError(PindoraAPIError):
    """Error when an unexpected response was received from Pindora"""

    msg = "Unexpected response from Pindora when {action} '{uuid}': [{status_code}] {text}"
