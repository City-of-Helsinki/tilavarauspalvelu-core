class HaukiError(Exception):
    """Base class for all Hauki client errors"""


class HaukiRequestError(HaukiError):
    """Request to the Hauki API failed"""


class HaukiAPIError(HaukiError):
    """Request succeeded but Hauki API returned an error"""


class HaukiConfigurationError(HaukiError):
    """Hauki settings are not configured correctly"""
