import json

import requests
from django.conf import settings
from requests import Response

from opening_hours.errors import HaukiAPIError, HaukiRequestError
from tilavarauspalvelu.utils import logging

REQUESTS_TIMEOUT = 15

logger = logging.getLogger(__name__)


def _hauki_response_json(response: Response) -> dict:
    """
    Parse a response from Hauki API as json
    Raises an appropriate error if parsing fails or response is not ok
    """
    try:
        response_json = response.json()
    except ValueError as e:
        logger.error(f"Could not read Hauki response as json: {e}")
        raise HaukiRequestError("Parsing Hauki API return data failed")

    if not response.ok:
        if "detail" in response_json:
            logger.error(f"Hauki API returned an error: {response_json['detail']}")
        else:
            logger.error("Hauki API returned an error")
        raise HaukiAPIError("Hauki API returned an error")

    return response_json


def make_hauki_get_request(url: str, params: dict | None = None):
    try:
        response = requests.get(
            url,
            params=params,
            timeout=REQUESTS_TIMEOUT,
        )
    except Exception as e:
        logger.error(f"Request to Hauki API failed: {e}")
        raise HaukiRequestError("Resource opening hours request failed")

    return _hauki_response_json(response)


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

    return _hauki_response_json(response)


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

    return _hauki_response_json(response)
