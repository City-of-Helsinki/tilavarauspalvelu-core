from __future__ import annotations

from copy import deepcopy

from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient

from tests.factories import HaukiAPIResourceListResponseFactory
from tests.helpers import ResponseMock, patch_method


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resources_all_pages__single_page():
    data = HaukiAPIResourceListResponseFactory.create()

    HaukiAPIClient.get.return_value = ResponseMock(status_code=200, json_data=deepcopy(data))

    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1])

    assert HaukiAPIClient.get.call_count == 1
    assert fetched_hauki_resources == data["results"]


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resources_all_pages__multiple_pages():
    page_1 = HaukiAPIResourceListResponseFactory.create(next="example.com/page2")
    page_2 = HaukiAPIResourceListResponseFactory.create()

    HaukiAPIClient.get.side_effect = [
        ResponseMock(status_code=200, json_data=deepcopy(page_1)),
        ResponseMock(status_code=200, json_data=deepcopy(page_2)),
    ]

    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1])

    assert HaukiAPIClient.get.call_count == 2
    assert fetched_hauki_resources == page_1["results"] + page_2["results"]


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resources_all_pages__nothing_returned():
    data = HaukiAPIResourceListResponseFactory.create(results=[])

    HaukiAPIClient.get.return_value = ResponseMock(status_code=200, json_data=deepcopy(data))

    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1])

    assert HaukiAPIClient.get.call_count == 1
    assert fetched_hauki_resources == []


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resources_all_pages__multiple_batches(settings):
    settings.HAUKI_RESOURCE_BATCH_SIZE = 1

    resource_1 = HaukiAPIResourceListResponseFactory.create()
    resource_2 = HaukiAPIResourceListResponseFactory.create()

    HaukiAPIClient.get.side_effect = [
        ResponseMock(status_code=200, json_data=deepcopy(resource_1)),
        ResponseMock(status_code=200, json_data=deepcopy(resource_2)),
    ]

    fetched_hauki_resources = HaukiAPIClient.get_resources_all_pages(hauki_resource_ids=[1, 2])

    assert HaukiAPIClient.get.call_count == 2
    assert fetched_hauki_resources == resource_1["results"] + resource_2["results"]
