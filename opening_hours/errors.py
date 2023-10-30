class HaukiError(Exception):
    """Base class for all Hauki client errors"""


class HaukiRequestError(HaukiError):
    """Request to the Hauki API failed"""


class HaukiAPIError(HaukiError):
    """Request succeeded but Hauki API returned an error"""


class HaukiConfigurationError(HaukiError):
    """Hauki API settings are not configured correctly"""


class HaukiValueError(HaukiError):
    """Generic Value error related to Hauki"""

