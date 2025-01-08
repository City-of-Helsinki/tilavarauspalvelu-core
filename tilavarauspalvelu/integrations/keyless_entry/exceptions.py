from __future__ import annotations

from utils.external_service.errors import ExternalServiceError

__all__ = [
    "PindoraAPIConfigurationError",
    "PindoraAPIError",
]


class PindoraAPIError(ExternalServiceError):
    """Error in Pindora API"""


class PindoraAPIConfigurationError(PindoraAPIError):
    """Pindora API settings are not configured correctly"""
