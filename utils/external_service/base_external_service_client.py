import json
from json import JSONDecodeError
from typing import Literal

from requests import Response, request

from merchants.verkkokauppa.constants import REQUEST_TIMEOUT_SECONDS
from utils.external_service.errors import ExternalServiceParseJSONError, ExternalServiceRequestError


class BaseExternalServiceClient:
    """Base class for creating external service clients"""

    SERVICE_NAME: str | None = None
    REQUEST_TIMEOUT_SECONDS: int | None = None

    ##################
    # Helper methods #
    ##################

    @staticmethod
    def _build_url(endpoint: str) -> str:
        raise NotImplementedError

    @classmethod
    def response_json(cls, response: Response) -> dict:
        """
        Parse a response from an API as json
        Raises an appropriate error if parsing fails or response is not ok
        """
        try:
            response_json = response.json()
        except (ValueError, JSONDecodeError):
            raise ExternalServiceParseJSONError(f"Parsing {cls.SERVICE_NAME} return data failed.")

        return response_json

    @classmethod
    def handle_500_error(cls, response: Response) -> None:
        raise ExternalServiceRequestError(response, cls.SERVICE_NAME)

    ################
    # Base methods #
    ################

    @classmethod
    def generic(
        cls,
        method: Literal["get", "post", "put"],
        url: str,
        **kwargs,
    ) -> Response:
        return request(method, url, **kwargs, timeout=REQUEST_TIMEOUT_SECONDS)

    @classmethod
    def get(cls, *, url: str, params: dict | None = None, headers=None) -> Response:
        response = cls.generic(
            "get",
            url=url,
            params=params,
            headers=headers,
        )

        if response.status_code >= 500:
            cls.handle_500_error(response)

        return response

    @classmethod
    def post(cls, *, url: str, data: dict | None = None, headers=None) -> Response:
        response = cls.generic(
            "post",
            url=url,
            data=json.dumps(data),
            headers=headers,
        )

        if response.status_code >= 500:
            cls.handle_500_error(response)

        return response

    @classmethod
    def put(cls, *, url: str, data: dict | None = None, headers=None) -> Response:
        response = cls.generic(
            "put",
            url=url,
            data=json.dumps(data),
            headers=headers,
        )

        if response.status_code >= 500:
            cls.handle_500_error(response)

        return response
