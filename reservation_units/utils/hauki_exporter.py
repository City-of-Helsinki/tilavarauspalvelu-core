from typing import Optional
from urllib.parse import urljoin

from django.conf import settings

from opening_hours.enums import ResourceType
from opening_hours.errors import HaukiAPIError, HaukiRequestError
from opening_hours.hauki_request import make_hauki_get_request
from opening_hours.resources import (
    Resource,
    send_resource_to_hauki,
    update_hauki_resource,
)
from reservation_units.models import ReservationUnit


class ReservationUnitHaukiExporter:
    def __init__(self, reservation_unit: ReservationUnit):
        self.reservation_unit = reservation_unit

    def _get_parent_id(self) -> Optional[int]:
        """Tries to get reservation_unit.unit hauki resource id from hauki.
        This is used when hauki_resource_id is not found from reservation unit's unit.
        """
        unit = self.reservation_unit.unit
        if not unit:
            return None
        unit_resource_id = f"{unit.hauki_resource_data_source_id}:{unit.hauki_resource_origin_id}"
        url = urljoin(
            settings.HAUKI_API_URL,
            f"/v1/resource/{unit_resource_id}",
        )
        try:
            resource_data = make_hauki_get_request(url, params={})
            id = resource_data["id"]
        except (HaukiAPIError, HaukiRequestError):
            id = None
        except (KeyError, IndexError, TypeError):
            id = None

        return id

    def _get_hauki_resource_object_from_reservation_unit(self) -> Resource:
        parent_id = self.reservation_unit.unit.hauki_resource_id or self._get_parent_id()
        if parent_id is None:
            raise ValueError("Unit did not have hauki resource id and could not get it from hauki.")

        department_id = getattr(self.reservation_unit.unit, "tprek_department_id", None)
        if not department_id:
            raise ValueError("Unit does not have a department id,")
        department_id = f"tprek:{department_id}"

        return Resource(
            id=self.reservation_unit.hauki_resource_id or None,
            name=self.reservation_unit.name,
            description=self.reservation_unit.description,
            address=None,
            origin_data_source_name="Tilavarauspalvelu",
            origin_data_source_id="tvp",
            origin_id=str(self.reservation_unit.uuid),
            organization=department_id,
            parents=[parent_id],
            children=[],
            resource_type=ResourceType.RESERVABLE,
        )

    def send_reservation_unit_to_hauki(self):
        hauki_resource_object = self._get_hauki_resource_object_from_reservation_unit()

        if self.reservation_unit.hauki_resource_id:
            response_data = update_hauki_resource(hauki_resource_object)
        else:
            response_data = send_resource_to_hauki(hauki_resource_object)

        if isinstance(response_data, Resource) and response_data.id:
            self.reservation_unit.hauki_resource_id = response_data.id
            self.reservation_unit.save()

        return response_data
