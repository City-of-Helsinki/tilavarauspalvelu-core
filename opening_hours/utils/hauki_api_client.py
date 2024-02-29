import datetime
from typing import Any, NotRequired, TypedDict, Unpack

from django.conf import settings

from opening_hours.errors import HaukiAPIError, HaukiConfigurationError
from opening_hours.utils.hauki_api_types import (
    HaukiAPIOpeningHoursResponse,
    HaukiAPIOpeningHoursResponseItem,
    HaukiAPIResource,
    HaukiAPIResourceListResponse,
)
from utils.external_service.base_external_service_client import BaseExternalServiceClient

__all__ = [
    "HaukiAPIClient",
]


class HaukiGetResourcesParams(TypedDict):
    resource_ids: NotRequired[str]  # Comma separated list of UUIDs. Supports [data_source_id]:[origin_id] style ids
    parent: NotRequired[str]  # ID of the parent resource
    child: NotRequired[str]  # ID of a child resource
    data_source: NotRequired[str]  # ID of the data source
    origin_id_exists: NotRequired[bool]  # Filter by existing/missing origin_id
    ordering: NotRequired[str]
    page: NotRequired[int]
    page_size: NotRequired[int]


class HaukiAPIClient(BaseExternalServiceClient):
    SERVICE_NAME = "Hauki"
    REQUEST_TIMEOUT_SECONDS = 30

    ############
    # resource #
    ############

    @classmethod
    def get_resources(
        cls, *, hauki_resource_ids: list[int], **kwargs: Unpack[HaukiGetResourcesParams]
    ) -> HaukiAPIResourceListResponse:
        # Prepare the URL
        url = cls._build_url("resource")
        query_params = {
            "resource_ids": ",".join(str(id_) for id_ in hauki_resource_ids),
            **kwargs,
        }

        response = cls.get(url=url, params=query_params)
        response_json: HaukiAPIResourceListResponse = cls.response_json(response)
        return response_json

    @classmethod
    def get_resource(cls, *, hauki_resource_id: str) -> HaukiAPIResource:
        url = cls._build_url(f"resource/{hauki_resource_id}")

        response = cls.get(url=url)
        response_json: HaukiAPIResource = cls.response_json(response)

        if not response_json.get("id"):
            raise HaukiAPIError("Hauki API did not return a resource id.")

        return response_json

    @classmethod
    def create_resource(cls, *, data: dict) -> HaukiAPIResource:
        url = cls._build_url("resource")

        response = cls.post(url=url, json=data)
        response_json: HaukiAPIResource = cls.response_json(response)

        if not response_json.get("id"):
            raise HaukiAPIError("Hauki API did not return a resource id.")

        return response_json

    @classmethod
    def update_resource(cls, *, data: dict) -> HaukiAPIResource:
        hauki_resource_id = data["id"]
        url = cls._build_url(f"resource/{hauki_resource_id}")

        response = cls.put(url=url, json=data)
        response_json: HaukiAPIResource = cls.response_json(response)

        if not response_json.get("id"):
            raise HaukiAPIError("Hauki API did not return a resource id.")

        return response_json

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
        response = cls.get(url=url, params=query_params)
        response_json: HaukiAPIOpeningHoursResponse = cls.response_json(response)

        if response_json["count"] == 0:
            raise HaukiAPIError(f"Hauki API did not return any resources matching '{hauki_resource_id}'.")
        if response_json["count"] > 1:
            raise HaukiAPIError("Received too many results from Hauki API.")

        return response_json["results"][0]

    ##################
    # Helper methods #
    ##################

    @classmethod
    def _build_url(cls, endpoint: str) -> str:
        if not settings.HAUKI_API_URL:
            raise HaukiConfigurationError("HAUKI_API_URL environment variable must to be configured.")

        hauki_api_url_base = settings.HAUKI_API_URL.removesuffix("/")
        return f"{hauki_api_url_base}/v1/{endpoint}/"

    @classmethod
    def _get_mutate_headers(cls, headers: dict[str, Any] | None) -> dict[str, Any]:
        """Add the API key to POST and PUT request headers."""
        if not settings.HAUKI_API_KEY:
            raise HaukiConfigurationError("HAUKI_API_KEY environment variable must to be configured.")

        return {"Authorization": f"APIToken {settings.HAUKI_API_KEY}"}
