from __future__ import annotations

from typing import Any

from utils.external_service.errors import ExternalServiceError


class SendEmailNotificationError(Exception):
    pass


class EmailBuilderConfigurationError(Exception):
    pass


class EmailTemplateValidationError(Exception):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        if len(args) > 0:
            self.message = args[0]


class HaukiAPIError(ExternalServiceError):
    """Request succeeded but Hauki API returned an error"""


class HaukiConfigurationError(ExternalServiceError):
    """Hauki API settings are not configured correctly"""


class ReservableTimeSpanClientError(Exception):
    pass


class ReservableTimeSpanClientValueError(ReservableTimeSpanClientError):
    pass


class ReservableTimeSpanClientNothingToDoError(ReservableTimeSpanClientError):
    pass
