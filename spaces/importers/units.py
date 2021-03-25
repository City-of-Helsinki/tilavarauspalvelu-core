from logging import getLogger

import requests
from django.contrib.gis.geos import Point
from django.db import transaction

from spaces.models import Location, Unit

logger = getLogger(__name__)


class UnitImporter:
    """Imports units from given json data source url.

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
            "service_map_id": "id",
            "name": "name_fi",
            "description": "desc_fi",
            "web_page": "www_fi",
            "email": "email",
            "phone": "phone",
        },
        "location": {
            "address_street": "street_address_fi",
            "address_zip": "address_zip",
            "address_city": "address_city_fi",
            "lat": "latitude",
            "lon": "longitude",
        },
        # These values we default to.
        "defaults": {
            "service_map_id": None,
            "name": None,
            "description": "",
            "web_page": "",
            "email": "",
            "phone": "",
            "address_street": None,
            "address_zip": None,
            "address_city": None,
            "lat": None,
            "lon": None,
        },
    }

    def __init__(self, url: str, single: bool = False, field_map: dict = None):
        self.url = url
        self.single = single
        if field_map:
            self.field_map = field_map

    @transaction.atomic
    def import_units(self):
        self.creation_counter = 0
        self.update_counter = 0

        resp = requests.get(self.url)
        resp.raise_for_status()
        unit_data = resp.json()

        if self.single:
            unit_data = [unit_data]

        for row in unit_data:
            created = self.create_unit(row)
            self._update_counters(created)

        logger.info(
            "Created %s\nUpdated %s" % (self.creation_counter, self.update_counter)
        )

    def _update_counters(self, created: bool):
        if created:
            self.creation_counter += 1
            return

        self.update_counter += 1

    def create_unit(self, importer_data: dict) -> bool:
        """Creates or updates an Unit object"""
        unit_data = {}
        for model_field, data_field in self.field_map["unit"].items():
            unit_data[model_field] = importer_data.get(
                data_field, self.field_map["defaults"].get(model_field)
            )

        unit, unit_created = Unit.objects.update_or_create(
            service_map_id=importer_data.get("id"), defaults=unit_data
        )

        location_data = {}
        for model_field, data_field in self.field_map["location"].items():
            location_data[model_field] = importer_data.get(
                data_field, self.field_map["defaults"].get(model_field)
            )
        location_data["unit"] = unit

        point = None
        lon = location_data.pop("lon", self.field_map["defaults"].get("lon"))
        lat = location_data.pop("lat", self.field_map["defaults"].get("lat"))
        if lon and lat:
            point = Point(lon, lat)

        location_data["coordinates"] = point

        location, _ = Location.objects.update_or_create(
            unit=unit, defaults=location_data
        )

        return unit_created
