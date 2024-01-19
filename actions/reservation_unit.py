import datetime
from typing import TYPE_CHECKING, Any

from common.date_utils import time_as_timedelta
from opening_hours.errors import HaukiAPIError, HaukiRequestError, HaukiValueError
from opening_hours.models import OriginHaukiResource
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import HaukiAPIResource, HaukiTranslatedField

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit

__all__ = [
    "ReservationUnitActions",
]


class ReservationUnitHaukiExporter:
    """
    Contains methods for sending ReservationUnit data to Hauki API.

    Kept separate from ReservationUnitActions to keep the class smaller and easier to read.
    """

    reservation_unit: "ReservationUnit"

    def send_reservation_unit_to_hauki(self) -> None:
        # Initialise data for the Hauki API
        hauki_resource_data = self._convert_reservation_unit_to_hauki_resource_data()

        # Send the data to Hauki API
        if self.reservation_unit.origin_hauki_resource is None:
            self._create_hauki_resource(hauki_resource_data)
        else:
            self._update_hauki_resource(hauki_resource_data)

    def _convert_reservation_unit_to_hauki_resource_data(self) -> dict[str, Any]:
        parent_unit_resource_id = self._get_parent_resource_id()
        if not parent_unit_resource_id:
            raise HaukiValueError("Parent Unit does have 'Hauki Resource' set and could not get it from Hauki API.")

        if not self.reservation_unit.unit.tprek_department_id:
            raise HaukiValueError("Parent Unit does not have a department id.")

        return {
            "name": HaukiTranslatedField(
                fi=self.reservation_unit.name_fi,
                sv=self.reservation_unit.name_sv,
                en=self.reservation_unit.name_en,
            ),
            "description": HaukiTranslatedField(
                fi=self.reservation_unit.description,
                sv=self.reservation_unit.description,
                en=self.reservation_unit.description,
            ),
            "resource_type": "reservable",
            "origins": [
                {
                    "data_source": {
                        "id": "tvp",
                        "name": "Tilavarauspalvelu",
                    },
                    "origin_id": str(self.reservation_unit.uuid),
                }
            ],
            "parents": [parent_unit_resource_id],
            "organization": f"tprek:{self.reservation_unit.unit.tprek_department_id}",
            "address": None,
            "children": [],
            "extra_data": {},
            "is_public": True,
            "timezone": "Europe/Helsinki",
        }

    def _get_parent_resource_id(self) -> int | None:
        """Get the parent units hauki resource id, so that the reservation unit can be added as a child in Hauki API."""
        parent_unit = self.reservation_unit.unit

        # No parent, no way to get the id
        if parent_unit is None:
            return None

        # If the parent has an origin_hauki_resource_id, use that
        if parent_unit.origin_hauki_resource is not None:
            return parent_unit.origin_hauki_resource.id

        # Unit doesn't have a hauki resource set, so try to get it from Hauki API
        # If the unit doesn't have a tprek_id, we can't get it from hauki
        if parent_unit.tprek_id is None:
            return None

        unit_origin_resource_id = f"tprek:{parent_unit.tprek_id}"
        try:
            resource_data = HaukiAPIClient.get_resource(hauki_resource_id=unit_origin_resource_id)
            return resource_data["id"]
        except (HaukiAPIError, HaukiRequestError, KeyError, IndexError, TypeError):
            return None

    def _create_hauki_resource(self, hauki_resource_data):
        """Create a new HaukiResource in Hauki API for the ReservationUnit."""
        # New Hauki Resource, create it in Hauki API and update the reservation unit
        response_data: HaukiAPIResource = HaukiAPIClient.create_resource(data=hauki_resource_data)

        if not response_data["id"]:
            raise HaukiValueError("Hauki API did not return a resource id.")

        # Save the returned Hauki Resource to the database as OriginHaukiResource
        origin_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id=response_data["id"])

        self.reservation_unit.origin_hauki_resource = origin_hauki_resource
        self.reservation_unit.save()

    def _update_hauki_resource(self, hauki_resource_data):
        """Update the Hauki Resource in Hauki API with ReservationUnits data."""
        hauki_resource_data["id"] = self.reservation_unit.origin_hauki_resource.id

        # Existing Hauki Resource, update it in Hauki API
        HaukiAPIClient.update_resource(data=hauki_resource_data)


class ReservationUnitActions(ReservationUnitHaukiExporter):
    def __init__(self, reservation_unit: "ReservationUnit"):
        self.reservation_unit = reservation_unit

    def get_actual_before_buffer(self, reservation_begin: datetime.datetime | datetime.time) -> datetime.timedelta:
        if self.reservation_unit.reservation_block_whole_day:
            return time_as_timedelta(reservation_begin)
        return self.reservation_unit.buffer_time_before or datetime.timedelta()

    def get_actual_after_buffer(self, reservation_end: datetime.datetime | datetime.time) -> datetime.timedelta:
        if self.reservation_unit.reservation_block_whole_day:
            delta = time_as_timedelta(reservation_end)
            if delta == datetime.timedelta():  # midnight
                return delta
            return datetime.timedelta(hours=24) - delta
        return self.reservation_unit.buffer_time_after or datetime.timedelta()
