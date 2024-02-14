import datetime
from typing import NotRequired, TypedDict, Unpack

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
        return cls.get(url=url, params=query_params)

    @classmethod
    def get_resource(cls, *, hauki_resource_id: str) -> HaukiAPIResource:
        url = cls._build_url(f"resource/{hauki_resource_id}")
        response_json = cls.get(url=url)

        if not response_json.get("id"):
            raise HaukiAPIError("Hauki API did not return a resource id.")

        return response_json

    @classmethod
    def create_resource(cls, *, data: dict) -> HaukiAPIResource:
        url = cls._build_url("resource")
        response_json = cls.post(url=url, data=data)

        if not response_json.get("id"):
            raise HaukiAPIError("Hauki API did not return a resource id.")

        return response_json

    @classmethod
    def update_resource(cls, *, data: dict) -> HaukiAPIResource:
        hauki_resource_id = data["id"]
        url = cls._build_url(f"resource/{hauki_resource_id}")
        response_json = cls.put(url=url, data=data)

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
        response_json: HaukiAPIOpeningHoursResponse = cls.get(url=url, params=query_params)
        if response_json["count"] == 0:
            raise HaukiAPIError(f"Hauki API did not return any resources matching '{hauki_resource_id}'.")
        if response_json["count"] > 1:
            raise HaukiAPIError("Received too many results from Hauki API.")

        return response_json["results"][0]

    ##################
    # Helper methods #
    ##################

    @staticmethod
    def _build_url(endpoint: str) -> str:
        if not settings.HAUKI_API_URL:
            raise HaukiConfigurationError("HAUKI_API_URL environment variable must to be configured.")

        hauki_api_url_base = settings.HAUKI_API_URL.removesuffix("/")
        return f"{hauki_api_url_base}/v1/{endpoint}/"

    @classmethod
    def get(
        cls, *, url: str, params: dict | None = None, headers: dict | None = None
    ) -> HaukiAPIResource | HaukiAPIResourceListResponse | HaukiAPIOpeningHoursResponse:
        response = super().get(url=url, params=params, headers=headers)
        return cls.response_json(response)

    @classmethod
    def post(cls, *, url: str, data: dict | None = None, **headers) -> HaukiAPIResource:
        if not settings.HAUKI_API_KEY:
            raise HaukiConfigurationError("HAUKI_API_KEY environment variable must to be configured.")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            **headers,
        }
        response = super().put(url=url, data=data, headers=headers)
        return cls.response_json(response)

    @classmethod
    def put(cls, *, url: str, data: dict | None = None, **headers) -> HaukiAPIResource:
        if not settings.HAUKI_API_KEY:
            raise HaukiConfigurationError("HAUKI_API_KEY environment variable must to be configured.")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"APIToken {settings.HAUKI_API_KEY}",
            **headers,
        }
        response = super().put(url=url, data=data, headers=headers)
        return cls.response_json(response)
