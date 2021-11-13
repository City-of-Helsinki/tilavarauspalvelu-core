import logging

import requests
from django.conf import settings
from kombu.utils import json

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


def make_hauki_post_request(url: str, data: dict):
    try:
        response = requests.post(
            url,
            data=json.dumps(data),
            timeout=REQUESTS_TIMEOUT,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            },
        )
    except Exception as e:
        logger.error(f"Post request to Hauki API failed: {e}")
        raise HaukiRequestError(f"Post request to Hauki url: {url} failed.")
    try:
        return_data = response.json()
    except ValueError as e:
        logger.error(f"Could not read Hauki response as json: {e}")
        raise HaukiRequestError("Parsing post return data failed")
    if not response.ok:
        if "detail" in return_data:
            logger.error(f"Hauki API returned an error: {return_data['detail']}")
        else:
            logger.error("Hauki API returned an error")
        raise HaukiAPIError("Hauki API returned an error")
    return return_data


def make_hauki_put_request(url: str, data: dict):
    try:
        response = requests.put(
            url,
            data=json.dumps(data),
            timeout=REQUESTS_TIMEOUT,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            },
        )
    except Exception as e:
        logger.error(f"Put request to Hauki API failed: {e}")
        raise HaukiRequestError(f"Post request to Hauki url: {url} failed.")
    try:
        return_data = response.json()
    except ValueError as e:
        logger.error(f"Could not read Hauki response as json: {e}")
        raise HaukiRequestError("Parsing post return data failed")
    if not response.ok:
        if "detail" in return_data:
            logger.error(f"Hauki API returned an error: {return_data['detail']}")
        else:
            logger.error("Hauki API returned an error")
        raise HaukiAPIError("Hauki API returned an error")
    return return_data
