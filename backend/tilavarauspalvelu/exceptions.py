from __future__ import annotations

from utils.external_service.errors import ExternalServiceError


class ApplicationRoundExporterError(Exception):
    """Error when exporting application round data"""


class ApplicationRoundResetError(Exception):
    """Error when resetting application round"""


class FirstReservableTimeError(Exception):
    """Error when calculating first reservable time"""


class HaukiAPIError(ExternalServiceError):
    """Request succeeded but Hauki API returned an error"""


class HaukiConfigurationError(ExternalServiceError):
    """Hauki API settings are not configured correctly"""


class PDFRenderingError(Exception):
    """Error when rendering PDF"""


class ReservableTimeSpanClientError(Exception):
    """Error in reservable time span client"""


class ReservableTimeSpanClientValueError(ReservableTimeSpanClientError):
    """Error in reservable time span client when given values are invalid"""


class ReservableTimeSpanClientNothingToDoError(ReservableTimeSpanClientError):
    """Error in reservable time span client when there is nothing to do"""


class ReservationPriceCalculationError(Exception):
    """Error when calculating reservation price"""


class TimeSpanElementError(Exception):
    """Error when dealing with time span elements"""


class TPRekImportError(Exception):
    """Error when importing TPRek data"""
