from __future__ import annotations

from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient

from tests.helpers import ResponseMock, patch_method


@patch_method(HaukiAPIClient.get_resources, return_value={"results": ["foo"]})
def test__HaukiAPIClient__get_resources_all_pages__single_page():
    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1])

    assert HaukiAPIClient.get_resources.call_count == 1
    assert fetched_hauki_resources == ["foo"]


@patch_method(
    HaukiAPIClient.get,
    side_effect=[
        ResponseMock(status_code=200, json_data={"results": ["foo"], "next": "page2"}),
        ResponseMock(status_code=200, json_data={"results": ["bar"], "next": None}),
    ],
)
def test__HaukiAPIClient__get_resources_all_pages__multiple_pages():
    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1])

    assert HaukiAPIClient.get.call_count == 2
    assert fetched_hauki_resources == ["foo", "bar"]


@patch_method(HaukiAPIClient.get_resources, return_value={"results": []})
def test__HaukiAPIClient__get_resources_all_pages__nothing_returned():
    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1])

    assert HaukiAPIClient.get_resources.call_count == 1
    assert fetched_hauki_resources == []
