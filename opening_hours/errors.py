from utils.external_service.errors import ExternalServiceError


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
