import json

from django.conf import settings
from requests import Response, request

from opening_hours.errors import HaukiAPIError, HaukiRequestError
from tilavarauspalvelu.utils import logging

REQUESTS_TIMEOUT = 15

logger = logging.getLogger(__name__)


class HaukiAPIClient:
    @staticmethod
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

    @classmethod
    def generic(cls, method: str, url: str, **kwargs):
        try:
            response = request(method, url, **kwargs, timeout=REQUESTS_TIMEOUT)
        except Exception as e:
            logger.error(f"Request to Hauki API failed: {e}")
            raise HaukiRequestError(f"{method.upper()} request to Hauki url: {url} failed")

        return cls._hauki_response_json(response)

    @classmethod
    def get(cls, url: str, params: dict | None = None) -> dict:
        return cls.generic(
            "get",
            url,
            params=params,
        )

    @classmethod
    def post(cls, url: str, data: dict) -> dict:
        return cls.generic(
            "post",
            url,
            data=json.dumps(data),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            },
        )

    @classmethod
    def put(cls, url: str, data: dict) -> dict:
        return cls.generic(
            "put",
            url,
            data=json.dumps(data),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            },
        )
