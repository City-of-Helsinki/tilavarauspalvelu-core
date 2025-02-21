from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, Literal

import stamina
from requests import request
from rest_framework.status import HTTP_500_INTERNAL_SERVER_ERROR

from utils.external_service.errors import (
    ExternalServiceError,
    ExternalServiceParseJSONError,
    ExternalServiceRequestError,
)

if TYPE_CHECKING:
    from requests import Response


class BaseExternalServiceClient:
    """Base class for creating external service clients"""

    SERVICE_NAME: str | None = None
    REQUEST_TIMEOUT_SECONDS: int | None = None

    ##################
    # Helper methods #
    ##################

    @staticmethod
    def _validate_env_variables() -> None:
        """
        Validate that all required environment variables are set.
        Override this method to add custom validations.
        """
        raise NotImplementedError

    @staticmethod
    def _build_url(endpoint: str) -> str:
        """
        Build the URL for the request.
        Override this method to add custom URL building.
        """
        raise NotImplementedError

    @classmethod
    def _get_headers(cls, headers: dict[str, Any] | None) -> dict[str, Any]:
        """
        Get headers for all requests.
        Override this method to add custom headers.
        """
        return headers or {}

    @classmethod
    def _get_mutate_headers(cls, headers: dict[str, Any] | None) -> dict[str, Any]:
        """
        Get headers for mutate requests.
        Override this method to add custom headers.

        This helper method is provided to allow different headers for different POST, PUT requests.
        """
        return cls._get_headers(headers)

    @classmethod
    def response_json(cls, response: Response) -> dict[str, Any] | list[dict[str, Any]]:
        """
        Parse a response from an API as json
        Raises an appropriate error if parsing fails or response is not ok
        """
        try:
            response_json = response.json()
        except (ValueError, json.JSONDecodeError) as err:
            msg = f"Parsing {cls.SERVICE_NAME} return data failed."
            raise ExternalServiceParseJSONError(msg) from err

        return response_json

    @classmethod
    def handle_500_error(cls, response: Response) -> None:
        raise ExternalServiceRequestError(response, cls.SERVICE_NAME)

    ################
    # Base methods #
    ################

    @classmethod
    def request(cls, method: Literal["get", "post", "put", "delete"], url: str, **kwargs: Any) -> Response:
        try:
            return request(method, url, **kwargs, timeout=cls.REQUEST_TIMEOUT_SECONDS)
        except Exception as err:
            # Convert all exceptions to ExternalServiceError to allow easily suppressing them with
            raise ExternalServiceError from err

    @classmethod
    @stamina.retry(on=Exception, attempts=3)  # Likely retry should happen no matter the exception
    def generic(cls, method: Literal["get", "post", "put", "delete"], url: str, **kwargs: Any) -> Response:
        response = cls.request(method=method, url=url, **kwargs)
        if response.status_code >= HTTP_500_INTERNAL_SERVER_ERROR:
            cls.handle_500_error(response)
        return response

    @classmethod
    def get(cls, *, url: str, params: dict[str, Any] | None = None, headers: dict[str, Any] | None = None) -> Response:
        return cls.generic("get", url=url, params=params, headers=cls._get_headers(headers))

    @classmethod
    def post(cls, *, url: str, json: dict[str, Any] | None = None, headers: dict[str, Any] | None = None) -> Response:
        return cls.generic("post", url=url, json=json, headers=cls._get_mutate_headers(headers))

    @classmethod
    def put(cls, *, url: str, json: dict[str, Any] | None = None, headers: dict[str, Any] | None = None) -> Response:
        return cls.generic("put", url=url, json=json, headers=cls._get_mutate_headers(headers))

    @classmethod
    def delete(cls, *, url: str, headers: dict[str, Any] | None = None) -> Response:
        return cls.generic("delete", url=url, headers=cls._get_mutate_headers(headers))
