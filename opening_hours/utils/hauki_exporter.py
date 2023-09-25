from dataclasses import dataclass

from opening_hours.enums import ResourceType
from opening_hours.errors import HaukiAPIError, HaukiRequestError
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import HaukiAPIResource
from reservation_units.models import ReservationUnit


@dataclass(order=True, frozen=True)
class HaukiResource:
    """Represents Resource in hauki"""

    id: int | None
    name: str
    description: str | None
    address: str | None
    children: list[int]
    parents: list[int]
    organization: str
    origin_id: str
    origin_data_source_name: str
    origin_data_source_id: str
    resource_type: ResourceType = ResourceType.RESERVABLE

    def convert_to_request_data(self):
        return {
            "name": self.name,
            "description": self.description,
            "address": self.address,
            "resource_type": self.resource_type.value,
            "children": self.children,
            "parents": self.parents,
            "organization": self.organization,
            "origins": [
                {
                    "data_source": {
                        "id": self.origin_data_source_id,
                        "name": self.origin_data_source_name,
                    },
                    "origin_id": self.origin_id,
                }
            ],
            "extra_data": {},
            "is_public": True,
            "timezone": "Europe/Helsinki",
        }


class ReservationUnitHaukiExporter:
    def __init__(self, reservation_unit: ReservationUnit):
        self.reservation_unit = reservation_unit

    def _get_parent_id(self) -> int | None:
        """
        Tries to get reservation_unit.unit `hauki_resource_id` from hauki.
        This is used when hauki_resource_id is not found from reservation_unit's unit.
        """
        unit = self.reservation_unit.unit
        if not unit or unit.tprek_id is None:
            return None

        unit_resource_id = f"{unit.hauki_resource_data_source_id}:{unit.tprek_id}"
        url = HaukiAPIClient.build_url(endpoint="resource", resource_id=unit_resource_id)

        try:
            resource_data: HaukiAPIResource = HaukiAPIClient.get(url=url)
            return resource_data["id"]
        except (HaukiAPIError, HaukiRequestError, KeyError, IndexError, TypeError):
            return None

    def _convert_reservation_unit_to_hauki_resource(self) -> HaukiResource:
        parent_id = self.reservation_unit.unit.hauki_resource_id or self._get_parent_id()
        if parent_id is None:
            raise ValueError("Unit did not have hauki resource id and could not get it from hauki.")

        department_id = getattr(self.reservation_unit.unit, "tprek_department_id", None)
        if not department_id:
            raise ValueError("Unit does not have a department id,")
        department_id = f"tprek:{department_id}"

        return HaukiResource(
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

    @staticmethod
    def _parse_response_data_to_hauki_resource(response_data: HaukiAPIResource) -> HaukiResource | HaukiAPIResource:
        try:
            resource_out = HaukiResource(
                id=response_data["id"],
                name=response_data["name"],
                description=response_data["description"],
                address=response_data["address"],
                resource_type=response_data["resource_type"],
                children=response_data["children"],
                parents=response_data["parents"],
                organization=response_data["organization"],
                origin_id=response_data["origins"][0]["origin_id"],
                origin_data_source_name=response_data["origins"][0]["data_source"]["name"],
                origin_data_source_id=response_data["origins"][0]["data_source"]["id"],
            )
        except (KeyError, ValueError, IndexError):
            resource_out = response_data
        return resource_out

    def send_reservation_unit_to_hauki(self) -> HaukiAPIResource:
        hauki_resource_object: HaukiResource = self._convert_reservation_unit_to_hauki_resource()
        data = hauki_resource_object.convert_to_request_data()

        if self.reservation_unit.hauki_resource_id:
            url = HaukiAPIClient.build_url(endpoint="resource", resource_id=hauki_resource_object.id)
            response_data: HaukiAPIResource = HaukiAPIClient.put(url=url, data=data)
        else:
            url = HaukiAPIClient.build_url(endpoint="resource")
            response_data: HaukiAPIResource = HaukiAPIClient.post(url=url, data=data)

        response_data = self._parse_response_data_to_hauki_resource(response_data)

        if isinstance(response_data, HaukiResource) and response_data.id:
            self.reservation_unit.hauki_resource_id = response_data.id
            self.reservation_unit.save()

        return response_data
