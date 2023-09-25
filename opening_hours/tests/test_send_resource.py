from unittest import mock

import pytest

from opening_hours.enums import ResourceType
from opening_hours.resources import (
    HaukiResource,
    send_resource_to_hauki,
    update_hauki_resource,
)


def _get_mocked_send_response_data(hauki_resource):
    return {
        "id": 1,
        "name": hauki_resource.name,
        "description": "",
        "address": None,
        "resource_type": hauki_resource.resource_type.value,
        "children": hauki_resource.children,
        "parents": hauki_resource.parents,
        "organization": hauki_resource.organization,
        "origins": [
            {
                "data_source": {
                    "id": hauki_resource.origin_data_source_id,
                    "name": hauki_resource.origin_data_source_name,
                },
                "origin_id": hauki_resource.origin_id,
            }
        ],
        "extra_data": {},
        "is_public": True,
        "timezone": "Europe/Helsinki",
    }


@mock.patch("opening_hours.resources.HaukiAPIClient.post")
def test__hauki__send_resource_to_hauki__send(mocked_haukiapiclient_post, hauki_resource):
    mocked_haukiapiclient_post.return_value = _get_mocked_send_response_data(hauki_resource)

    data = send_resource_to_hauki(hauki_resource)
    assert data is not None
    assert data.id is not None


@mock.patch("opening_hours.resources.HaukiAPIClient.put")
def test__hauki__send_resource_to_hauki__update(mocked_haukiapiclient_post, hauki_resource):
    mocked_haukiapiclient_post.return_value = _get_mocked_send_response_data(hauki_resource)

    # Convert an existing resource to a format that can be sent to the Hauki API
    data = hauki_resource.convert_to_request_data()
    resource = HaukiResource(
        id=1,
        name=data["name"],
        description=data["description"],
        address=data["address"],
        resource_type=ResourceType.RESERVABLE,
        children=data["children"],
        parents=data["parents"],
        organization=data["organization"],
        origin_id=data["origins"][0]["origin_id"],
        origin_data_source_name=data["origins"][0]["data_source"]["name"],
        origin_data_source_id=data["origins"][0]["data_source"]["id"],
    )

    data = update_hauki_resource(resource)
    assert data is not None
    assert data.id is not None


@mock.patch("opening_hours.resources.HaukiAPIClient.put")
def test__hauki__send_resource_to_hauki__update__resource_has_no_id(mocked_haukiapiclient_post, hauki_resource):
    mocked_haukiapiclient_post.return_value = _get_mocked_send_response_data(hauki_resource)

    with pytest.raises(ValueError):  # noqa: PT011
        update_hauki_resource(hauki_resource)
