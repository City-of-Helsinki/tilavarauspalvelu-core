import datetime
from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings
from django.contrib.gis.geos import Point
from django.utils.timezone import get_default_timezone
from requests import Response

from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError, ExternalServiceRequestError

DEFAULT_TIMEZONE = get_default_timezone()


@dataclass
class TprekUnitData:
    tprek_id: str | None
    name: str | None
    name_fi: str | None
    name_en: str | None
    name_sv: str | None
    description: str
    short_description: str
    web_page: str
    email: str
    phone: str
    tprek_department_id: str | None
    tprek_last_modified: datetime.datetime | None

    @classmethod
    def from_response_json(cls, response_json: dict[str, Any]) -> "TprekUnitData":
        try:
            modified_time = response_json.get("modified_time")
            tprek_last_modified = datetime.datetime.fromisoformat(modified_time).replace(tzinfo=DEFAULT_TIMEZONE)
        except (TypeError, ValueError):
            tprek_last_modified = None

        return cls(
            tprek_id=str(response_json.get("id")),
            name=response_json.get("name_fi"),
            name_fi=response_json.get("name_fi"),
            name_en=response_json.get("name_en"),
            name_sv=response_json.get("name_sv"),
            description=response_json.get("desc_fi", ""),
            short_description=response_json.get("short_desc_fi", ""),
            web_page=response_json.get("www_fi", ""),
            email=response_json.get("email", ""),
            phone=response_json.get("phone", ""),
            tprek_department_id=response_json.get("dept_id"),
            tprek_last_modified=tprek_last_modified,
        )


@dataclass
class TprekLocationData:
    address_street: str | None
    address_street_fi: str | None
    address_street_en: str | None
    address_street_sv: str | None
    address_zip: str | None
    address_city: str | None
    address_city_fi: str | None
    address_city_en: str | None
    address_city_sv: str | None
    coordinates: Point | None

    @classmethod
    def from_response_json(cls, response_json: dict[str, Any]) -> "TprekLocationData":
        coordinates = None
        if (lat := response_json.get("latitude")) and (lon := response_json.get("longitude")):
            coordinates = Point(lon, lat)

        return cls(
            address_street=response_json.get("street_address_fi"),
            address_street_fi=response_json.get("street_address_fi"),
            address_street_en=response_json.get("street_address_en"),
            address_street_sv=response_json.get("street_address_sv"),
            address_zip=response_json.get("address_zip"),
            address_city=response_json.get("address_city_fi"),
            address_city_fi=response_json.get("address_city_fi"),
            address_city_en=response_json.get("address_city_en"),
            address_city_sv=response_json.get("address_city_sv"),
            coordinates=coordinates,
        )


class TprekAPIClient(BaseExternalServiceClient):
    """
    Client for fetching data from the TPREK API.

    Documentation: https://www.hel.fi/palvelukarttaws/restpages/ver4.html#_unit
    """

    SERVICE_NAME = "Tprek"
    REQUEST_TIMEOUT_SECONDS = 15

    @classmethod
    def get_unit(cls, unit_tprek_id: str) -> tuple[TprekUnitData | None, TprekLocationData | None]:
        url = cls._build_url(unit_tprek_id)
        response = cls.get(url=url)
        response_json: dict[str, Any] = cls.response_json(response)

        if response_json is None:
            return None, None

        unit_data = TprekUnitData.from_response_json(response_json)
        location_data = TprekLocationData.from_response_json(response_json)

        return unit_data, location_data

    ##################
    # Helper methods #
    ##################

    @staticmethod
    def _build_url(endpoint: str) -> str:
        if not settings.TPREK_UNIT_URL:
            raise ExternalServiceError("'TPREK_UNIT_URL' environment variable must to be configured.")

        tprek_api_url_base = settings.TPREK_UNIT_URL.removesuffix("/")
        return f"{tprek_api_url_base}/{endpoint}"

    @classmethod
    def get(cls, *, url: str, params: dict[str, Any] | None = None, headers: dict[str, Any] | None = None) -> Response:
        response = super().get(url=url, params=params, headers=headers)

        # Additional error handling
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as err:
            raise ExternalServiceRequestError(response=response, service_name=cls.SERVICE_NAME) from err

        return response
