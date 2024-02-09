import datetime
import json
from typing import NotRequired, TypedDict, Unpack

from django.conf import settings
from requests import Response, request

from opening_hours.errors import HaukiAPIError, HaukiConfigurationError, HaukiRequestError
from opening_hours.utils.hauki_api_types import (
    HaukiAPIOpeningHoursResponse,
    HaukiAPIOpeningHoursResponseItem,
    HaukiAPIResource,
    HaukiAPIResourceListResponse,
)
from tilavarauspalvelu.utils import logging

__all__ = [
    "HaukiAPIClient",
]

REQUESTS_TIMEOUT = 15

logger = logging.getLogger(__name__)


class HaukiGetResourcesParams(TypedDict):
    resource_ids: NotRequired[str]  # Comma separated list of UUIDs. Supports [data_source_id]:[origin_id] style ids
    parent: NotRequired[str]  # ID of the parent resource
    child: NotRequired[str]  # ID of a child resource
    data_source: NotRequired[str]  # ID of the data source
    origin_id_exists: NotRequired[bool]  # Filter by existing/missing origin_id
    ordering: NotRequired[str]
    page: NotRequired[int]
    page_size: NotRequired[int]


class HaukiAPIClient:
    ############
    # resource #
    ############

    @classmethod
    def get_resources(
        cls,
        *,
        hauki_resource_ids: list[int],
        **kwargs: Unpack[HaukiGetResourcesParams],
    ) -> HaukiAPIResourceListResponse:
        # Prepare the URL
        url = cls._build_url("resource")
        query_params = {
            "resource_ids": ",".join(str(id_) for id_ in hauki_resource_ids),
            **kwargs,
        }

        return cls.get(url=url, params=query_params)

    @classmethod
    def get_resource(cls, *, hauki_resource_id: str) -> HaukiAPIResource:
        url = cls._build_url(f"resource/{hauki_resource_id}")

        return cls.get(url=url)

    @classmethod
    def create_resource(cls, *, data: dict) -> HaukiAPIResource:
        url = cls._build_url("resource")

        return cls.post(url=url, data=data)

    @classmethod
    def update_resource(cls, *, data: dict) -> HaukiAPIResource:
        hauki_resource_id = data["id"]
        url = cls._build_url(f"resource/{hauki_resource_id}")

        return cls.put(url=url, data=data)

    #################
    # opening_hours #
    #################

    @classmethod
    def get_resource_opening_hours(
        cls,
        *,
        hauki_resource_id: int,
        start_date: datetime.date,
        end_date: datetime.date,
    ) -> HaukiAPIOpeningHoursResponseItem:
        """
        Fetch a single resource's opening hours for a given date range.

        The `/v1/opening_hours/` endpoint is used instead of `/v1/resource/{}/opening_hours/`,
        as we need the resource's timezone info.
        The `/v1/resource/{}/opening_hours/` endpoint returns only opening hours, while the `/v1/opening_hours/`
        endpoint returns both the resource (which includes its timezone) and the resources opening hours.
        """
        # Prepare the URL
        url = cls._build_url("opening_hours")
        query_params = {
            "resource": hauki_resource_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }

        # Get the data from Hauki API
        response: HaukiAPIOpeningHoursResponse = cls.get(url=url, params=query_params)
        if response["count"] == 0:
            raise HaukiAPIError(f"Hauki API did not return any resources matching '{hauki_resource_id}'.")
        if response["count"] > 1:
            raise HaukiAPIError("Received too many results from Hauki API.")

        return response["results"][0]

    ##################
    # Helper methods #
    ##################

    @staticmethod
    def _build_url(endpoint: str):
        if not settings.HAUKI_API_URL:
            raise HaukiConfigurationError("HAUKI_API_URL environment variable must to be configured.")

        hauki_api_url_base = settings.HAUKI_API_URL.removesuffix("/")
        return f"{hauki_api_url_base}/v1/{endpoint}/"

    @staticmethod
    def _hauki_response_json(response: Response):
        """
        Parse a response from Hauki API as json
        Raises an appropriate error if parsing fails or response is not ok
        """
        try:
            response_json = response.json()
        except ValueError:
            logger.exception("Could not read Hauki response as json.")
            raise HaukiRequestError("Parsing Hauki API return data failed")

        if not response.ok:
            if "detail" in response_json:
                logger.error(f"Hauki API returned an error: {response_json['detail']}")
            else:
                logger.error("Hauki API returned an error")
            raise HaukiAPIError("Hauki API returned an error")

        return response_json

    ################
    # Base methods #
    ################

    @classmethod
    def generic(cls, method: str, url: str, **kwargs):
        try:
            response = request(method, url, **kwargs, timeout=REQUESTS_TIMEOUT)
        except Exception:
            logger.exception("Request to Hauki API failed.")
            raise HaukiRequestError(f"{method.upper()} request to Hauki url: {url} failed")

        return cls._hauki_response_json(response)

    @classmethod
    def get(cls, url: str, params: dict | None = None):
        return cls.generic(
            "get",
            url,
            params=params,
        )

    @classmethod
    def post(cls, url: str, data: dict):
        if not settings.HAUKI_API_KEY:
            raise HaukiConfigurationError("HAUKI_API_KEY environment variable must to be configured.")

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
    def put(cls, url: str, data: dict):
        if not settings.HAUKI_API_KEY:
            raise HaukiConfigurationError("HAUKI_API_KEY environment variable must to be configured.")

        return cls.generic(
            "put",
            url,
            data=json.dumps(data),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            },
        )
