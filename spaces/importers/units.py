from logging import getLogger

import requests
from django.contrib.gis.geos import Point
from django.db import transaction

from opening_hours.utils.hauki_api_client import HaukiAPIClient
from spaces.models import Location, Unit

logger = getLogger(__name__)
REQUEST_TIMEOUT_SECONDS = 15


class UnitImporter:
    """
    Imports units from given json data source url.

    Unit importer uses field map dict to map django db fields
    and the data source's fields. Field map also should define the default values
    to be used for missing values.
    Field map can be given as a kwarg in __init__ and should be formatted like:
        field_map = {
            "unit": {
                "<unit model field>": "<data source field>",
                ...
            },
            "location": {
                "<location model field>": "<data source field>",
                ...
            },
        }

    """

    # Field map is used to map to django model fields to api data.
    field_map = {
        "unit": {
            "tprek_id": "id",
            "name": "name_fi",
            "name_fi": "name_fi",
            "name_en": "name_en",
            "name_sv": "name_sv",
            "description": "desc_fi",
            "short_description": "short_desc_fi",
            "web_page": "www_fi",
            "email": "email",
            "phone": "phone",
            "tprek_department_id": "dept_id",
        },
        "location": {
            "address_street": "street_address_fi",
            "address_street_fi": "street_address_fi",
            "address_street_en": "street_address_en",
            "address_street_sv": "street_address_sv",
            "address_zip": "address_zip",
            "address_city": "address_city_fi",
            "address_city_fi": "address_city_fi",
            "address_city_en": "address_city_en",
            "address_city_sv": "address_city_sv",
            "lat": "latitude",
            "lon": "longitude",
        },
        # These values we default to.
        "defaults": {
            "tprek_id": None,
            "name": None,
            "description": "",
            "short_description": "",
            "web_page": "",
            "email": "",
            "phone": "",
            "address_street": None,
            "address_zip": None,
            "address_city": None,
            "lat": None,
            "lon": None,
            "tprek_department_id": None,
        },
    }

    def __init__(
        self,
        url: str,
        single: bool = False,
        field_map: dict | None = None,
    ):
        self.url = url
        self.single = single
        if field_map:
            self.field_map = field_map

        self.imported_unit_ids = []
        self.creation_counter = 0
        self.update_counter = 0

    @transaction.atomic
    def import_units(self, import_hauki_resource_ids: bool = False):
        resp = requests.get(self.url, timeout=REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        unit_data = resp.json()

        if self.single:
            unit_data = [unit_data]

        for row in filter(lambda data: data is not None, unit_data):
            created = self.create_unit(row)
            self._update_counters(created)

        logger.info(f"Created {self.creation_counter}\nUpdated {self.update_counter}")
        if import_hauki_resource_ids:
            hauki_importer = UnitHaukiResourceIdImporter()
            logger.info("Importing from Hauki...")
            hauki_importer.import_hauki_resource_ids_for_units(unit_ids=self.imported_unit_ids)

    def _update_counters(self, created: bool):
        if created:
            self.creation_counter += 1
            return

        self.update_counter += 1

    def create_unit(self, importer_data: dict) -> bool:
        """Creates or updates a Unit object"""
        unit_data = {}
        for model_field, data_field in self.field_map["unit"].items():
            unit_data[model_field] = importer_data.get(data_field, self.field_map["defaults"].get(model_field))

        unit, unit_created = Unit.objects.update_or_create(tprek_id=importer_data.get("id"), defaults=unit_data)

        location_data = {}
        for model_field, data_field in self.field_map["location"].items():
            location_data[model_field] = importer_data.get(data_field, self.field_map["defaults"].get(model_field))
        location_data["unit"] = unit

        point = None
        lon = location_data.pop("lon", self.field_map["defaults"].get("lon"))
        lat = location_data.pop("lat", self.field_map["defaults"].get("lat"))
        if lon and lat:
            point = Point(lon, lat)

        location_data["coordinates"] = point

        Location.objects.update_or_create(unit=unit, defaults=location_data)

        self.imported_unit_ids.append(unit.id)

        return unit_created


class UnitHaukiResourceIdImporter:
    def __init__(self):
        self.resource_id_map = {}
        self.response_page_counter = 0

    def read_response(self, data):
        self.response_page_counter += 1
        logger.info(f"Fetching from hauki. Page number: {self.response_page_counter}")
        for resource in data["results"]:
            for origin in resource["origins"]:
                if origin["data_source"]["id"] == "tprek":
                    self.resource_id_map[origin["origin_id"]] = resource["id"]

    @transaction.atomic
    def import_hauki_resource_ids_for_units(
        self,
        unit_ids: list[int] | None = None,
        tprek_ids: list[str] | None = None,
    ):
        if not unit_ids and not tprek_ids:
            raise ValueError("Either unit_ids or tprek_ids is required.")

        # Use `unit_ids` if given, otherwise use `tprek_ids`.
        units = Unit.objects.filter(id__in=unit_ids) if unit_ids else Unit.objects.filter(tprek_id__in=tprek_ids)

        url = HaukiAPIClient.build_url(endpoint="resource")

        logger.info(f"Importing units {units} resource ids from url {url}")

        params = {
            "data_source": "tprek",
            "origin_id_exists": True,
            "page_size": 50000,
        }

        # Keep fetching results until there are no more pages.
        while url:
            data = HaukiAPIClient.get(url=url, params=params)
            self.read_response(data)
            url = data.get("next", None)

        resource_ids_updated = []
        for unit in units:
            resource_id = self.resource_id_map.get(unit.tprek_id)
            if resource_id:
                unit.hauki_resource_id = resource_id
                unit.save()
                resource_ids_updated.append(unit.tprek_id)

        logger.info(f"Updated resource ids for {len(resource_ids_updated)} units.")
