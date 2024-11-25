from __future__ import annotations

from typing import TYPE_CHECKING, Any, NotRequired, TypedDict, Unpack

from django.conf import settings

from tilavarauspalvelu.exceptions import HaukiAPIError, HaukiConfigurationError
from utils.external_service.base_external_service_client import BaseExternalServiceClient

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.utils.opening_hours.hauki_api_types import (
        HaukiAPIDatePeriod,
        HaukiAPIOpeningHoursResponse,
        HaukiAPIOpeningHoursResponseItem,
        HaukiAPIResource,
        HaukiAPIResourceListResponse,
    )

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
    """
    Client for the Hauki API.

    API documentation: https://hauki-api.test.hel.ninja/api_docs/swagger/
    """

    SERVICE_NAME = "Hauki"
    REQUEST_TIMEOUT_SECONDS = 30

    ############
    # resource #
    ############

    @classmethod
    def get_resources(
        cls,
        *,
        hauki_resource_ids: list[int | str],
        **kwargs: Unpack[HaukiGetResourcesParams],
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
    def get_resources_all_pages(
        cls,
        *,
        hauki_resource_ids: list[int | str],
        **kwargs: Unpack[HaukiGetResourcesParams],
    ) -> list[HaukiAPIResource]:
        """Fetch resources from Hauki API based on the given resource ids."""
        response_json = HaukiAPIClient.get_resources(hauki_resource_ids=hauki_resource_ids, **kwargs)
        fetched_hauki_resources: list[HaukiAPIResource] = response_json["results"]

        # In case of multiple pages, keep fetching resources until there are no more pages
        resource_page_counter = 1
        while next_page_url := response_json.get("next"):
            resource_page_counter += 1
            response_json: HaukiAPIResourceListResponse = cls.response_json(cls.get(url=next_page_url))
            fetched_hauki_resources.extend(response_json["results"])

        return fetched_hauki_resources

    @classmethod
    def get_resource(cls, *, hauki_resource_id: str) -> HaukiAPIResource:
        url = cls._build_url(f"resource/{hauki_resource_id}")

        response = cls.get(url=url)
        response_json: HaukiAPIResource = cls.response_json(response)

        if not response_json.get("id"):
            msg = "Hauki API did not return a resource id."
            raise HaukiAPIError(msg)

        return response_json

    @classmethod
    def create_resource(cls, *, data: dict) -> HaukiAPIResource:
        url = cls._build_url("resource")

        response = cls.post(url=url, json=data)
        response_json: HaukiAPIResource = cls.response_json(response)

        if not response_json.get("id"):
            msg = "Hauki API did not return a resource id."
            raise HaukiAPIError(msg)

        return response_json

    @classmethod
    def update_resource(cls, *, data: dict) -> HaukiAPIResource:
        hauki_resource_id = data["id"]
        url = cls._build_url(f"resource/{hauki_resource_id}")

        response = cls.put(url=url, json=data)
        response_json: HaukiAPIResource = cls.response_json(response)

        if not response_json.get("id"):
            msg = "Hauki API did not return a resource id."
            raise HaukiAPIError(msg)

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
            msg = f"Hauki API did not return any resources matching '{hauki_resource_id}'."
            raise HaukiAPIError(msg)
        if response_json["count"] > 1:
            msg = "Received too many results from Hauki API."
            raise HaukiAPIError(msg)

        return response_json["results"][0]

    ###############
    # date_period #
    ###############

    @classmethod
    def get_date_periods(cls, *, hauki_resource_id: int, **kwargs: Any) -> list[HaukiAPIDatePeriod]:
        """
        Fetch a single resource's DatePeriods.

        Supports filtering by start_date_gte, start_date_lte, end_date_gte, end_date_lte in iso format or relative time
        e.g. start_date_gte="2024-01-01", end_date_gte="-1d" (end date must be after yesterday)
        """
        # Prepare the URL
        url = cls._build_url("date_period")
        query_params = {"resource": hauki_resource_id, **kwargs}

        # Get the data from Hauki API
        response = cls.get(url=url, params=query_params)
        return cls.response_json(response)

    ##################
    # Helper methods #
    ##################

    @classmethod
    def _build_url(cls, endpoint: str) -> str:
        if not settings.HAUKI_API_URL:
            msg = "HAUKI_API_URL environment variable must to be configured."
            raise HaukiConfigurationError(msg)

        hauki_api_url_base = settings.HAUKI_API_URL.removesuffix("/")
        return f"{hauki_api_url_base}/v1/{endpoint}/"

    @classmethod
    def _get_mutate_headers(cls, headers: dict[str, Any] | None) -> dict[str, Any]:  # noqa: ARG003
        """Add the API key to POST and PUT request headers."""
        if not settings.HAUKI_API_KEY:
            msg = "HAUKI_API_KEY environment variable must to be configured."
            raise HaukiConfigurationError(msg)

        return {"Authorization": f"APIToken {settings.HAUKI_API_KEY}"}
