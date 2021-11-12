from dataclasses import dataclass
from typing import List, Optional
from urllib.parse import urljoin

from django.conf import settings

from opening_hours.enums import ResourceType
from opening_hours.errors import HaukiConfigurationError
from opening_hours.hauki_request import make_hauki_post_request, make_hauki_put_request


@dataclass(order=True, frozen=True)
class Resource:
    """Represents Resource in hauki"""

    id: int
    name: str
    description: Optional[str]
    address: Optional[str]
    children: List[int]
    parents: List[int]
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


def send_resource_to_hauki(resource: Resource):
    if not (settings.HAUKI_API_URL and settings.HAUKI_API_KEY):
        raise HaukiConfigurationError(
            "Both hauki api url and hauki api key need to be configured"
        )

    resources_url = urljoin(settings.HAUKI_API_URL, "/v1/resource/")

    data = resource.convert_to_request_data()

    response_data = make_hauki_post_request(resources_url, data)

    try:
        resource_out = Resource(
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


def update_hauki_resource(resource: Resource):
    if not (settings.HAUKI_API_URL and settings.HAUKI_API_KEY):
        raise HaukiConfigurationError(
            "Both hauki api url and hauki secret need to be configured"
        )
    if not resource.id:
        raise ValueError("Resource id must be set when updating resource in hauki.")

    resources_url = urljoin(settings.HAUKI_API_URL, f"/v1/resource/{resource.id}")

    data = resource.convert_to_request_data()

    response_data = make_hauki_put_request(resources_url, data)

    try:
        resource_out = Resource(
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
