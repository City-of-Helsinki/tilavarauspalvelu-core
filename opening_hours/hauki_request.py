import logging

import requests

from opening_hours.errors import HaukiAPIError, HaukiRequestError

REQUESTS_TIMEOUT = 15

logger = logging.getLogger(__name__)


def make_hauki_get_request(url, params):
    try:
        response = requests.get(url, params=params, timeout=REQUESTS_TIMEOUT)
    except Exception as e:
        logger.error(f"Request to Hauki API failed: {e}")
        raise HaukiRequestError("Resource opening hours request failed")
    try:
        response_data = response.json()
    except ValueError as e:
        logger.error(f"Could not read Hauki response as json: {e}")
        raise HaukiRequestError("Resource opening hours response parsing failed")
    if not response.ok:
        if "detail" in response_data:
            logger.error(f"Hauki API returned an error: {response_data['detail']}")
        else:
            logger.error("Hauki API returned an error")
        raise HaukiAPIError("Hauki API returned an error")
    return response_data
