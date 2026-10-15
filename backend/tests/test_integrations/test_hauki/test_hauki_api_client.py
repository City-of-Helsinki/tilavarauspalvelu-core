from __future__ import annotations

import datetime
from copy import deepcopy

import pytest

from tilavarauspalvelu.exceptions import HaukiAPIError, HaukiConfigurationError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient

from tests.factories import HaukiAPIResourceFactory, HaukiAPIResourceListResponseFactory
from tests.helpers import ResponseMock, exact, patch_method

# ── Get resources ──


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


# ── Get resource ──


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resource():
    resource = HaukiAPIResourceFactory.create(id=999)

    HaukiAPIClient.get.return_value = ResponseMock(status_code=200, json_data=deepcopy(resource))

    fetched_hauki_resource = HaukiAPIClient.get_resource(hauki_resource_id="tprek:1234")

    assert fetched_hauki_resource == resource
    assert HaukiAPIClient.get.call_args.kwargs == {"url": "https://fake.test.hauki.api.com/v1/resource/tprek:1234/"}


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resource__not_found():
    HaukiAPIClient.get.return_value = ResponseMock(status_code=404, json_data={"detail": "Not found."})

    msg = "Hauki API did not return a resource id."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        HaukiAPIClient.get_resource(hauki_resource_id="tprek:1234")


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resource__api_url_not_configured(settings):
    settings.HAUKI_API_URL = ""

    msg = "HAUKI_API_URL environment variable must to be configured."
    with pytest.raises(HaukiConfigurationError, match=exact(msg)):
        HaukiAPIClient.get_resource(hauki_resource_id="tprek:1234")

    assert HaukiAPIClient.get.call_count == 0


# ── Create resource ──


@patch_method(HaukiAPIClient.request)
def test__HaukiAPIClient__create_resource():
    resource = HaukiAPIResourceFactory.create(id=999)
    data = {"name": {"fi": "Resource"}, "parents": [888]}

    HaukiAPIClient.request.return_value = ResponseMock(status_code=201, json_data=deepcopy(resource), method="POST")

    created_hauki_resource = HaukiAPIClient.create_resource(data=data)

    assert created_hauki_resource == resource
    assert HaukiAPIClient.request.call_args.kwargs == {
        "method": "post",
        "url": "https://fake.test.hauki.api.com/v1/resource/",
        "json": data,
        "headers": {"Authorization": "APIToken HAUKI_API_KEY"},
    }


@patch_method(HaukiAPIClient.request)
def test__HaukiAPIClient__create_resource__invalid_data():
    HaukiAPIClient.request.return_value = ResponseMock(
        status_code=400,
        json_data={"name": ["This field is required."]},
        method="POST",
    )

    msg = "Hauki API did not return a resource id."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        HaukiAPIClient.create_resource(data={"parents": [888]})


@patch_method(HaukiAPIClient.request)
def test__HaukiAPIClient__create_resource__api_key_not_configured(settings):
    settings.HAUKI_API_KEY = ""

    msg = "HAUKI_API_KEY environment variable must to be configured."
    with pytest.raises(HaukiConfigurationError, match=exact(msg)):
        HaukiAPIClient.create_resource(data={"name": {"fi": "Resource"}})

    assert HaukiAPIClient.request.call_count == 0


# ── Update resource ──


@patch_method(HaukiAPIClient.request)
def test__HaukiAPIClient__update_resource():
    resource = HaukiAPIResourceFactory.create(id=999)
    data = {"id": 999, "name": {"fi": "Resource"}}

    HaukiAPIClient.request.return_value = ResponseMock(status_code=200, json_data=deepcopy(resource), method="PUT")

    updated_hauki_resource = HaukiAPIClient.update_resource(data=data)

    assert updated_hauki_resource == resource
    assert HaukiAPIClient.request.call_args.kwargs == {
        "method": "put",
        "url": "https://fake.test.hauki.api.com/v1/resource/999/",
        "json": data,
        "headers": {"Authorization": "APIToken HAUKI_API_KEY"},
    }


@patch_method(HaukiAPIClient.request)
def test__HaukiAPIClient__update_resource__not_found():
    HaukiAPIClient.request.return_value = ResponseMock(
        status_code=404,
        json_data={"detail": "Not found."},
        method="PUT",
    )

    msg = "Hauki API did not return a resource id."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        HaukiAPIClient.update_resource(data={"id": 999, "name": {"fi": "Resource"}})


# ── Get resource opening hours ──


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resource_opening_hours__no_results():
    HaukiAPIClient.get.return_value = ResponseMock(status_code=200, json_data={"count": 0, "results": []})

    msg = "Hauki API did not return any resources matching '999'."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        HaukiAPIClient.get_resource_opening_hours(
            hauki_resource_id=999,
            start_date=datetime.date(2024, 1, 1),
            end_date=datetime.date(2024, 1, 31),
        )


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_resource_opening_hours__too_many_results():
    result = {"resource": {"timezone": "Europe/Helsinki"}, "opening_hours": []}
    HaukiAPIClient.get.return_value = ResponseMock(status_code=200, json_data={"count": 2, "results": [result, result]})

    msg = "Received too many results from Hauki API."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        HaukiAPIClient.get_resource_opening_hours(
            hauki_resource_id=999,
            start_date=datetime.date(2024, 1, 1),
            end_date=datetime.date(2024, 1, 31),
        )


# ── Get date periods ──


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_date_periods():
    date_periods = [
        {
            "id": 1,
            "resource": 999,
            "start_date": "2024-12-24",
            "end_date": "2024-12-26",
            "resource_state": "closed",
            "override": True,
        },
    ]

    HaukiAPIClient.get.return_value = ResponseMock(status_code=200, json_data=deepcopy(date_periods))

    fetched_date_periods = HaukiAPIClient.get_date_periods(
        hauki_resource_id=999,
        start_date_lte="2024-12-31",
        end_date_gte="2024-12-01",
    )

    assert fetched_date_periods == date_periods
    assert HaukiAPIClient.get.call_args.kwargs == {
        "url": "https://fake.test.hauki.api.com/v1/date_period/",
        "params": {"resource": 999, "start_date_lte": "2024-12-31", "end_date_gte": "2024-12-01"},
    }


@patch_method(HaukiAPIClient.get)
def test__HaukiAPIClient__get_date_periods__not_found():
    HaukiAPIClient.get.return_value = ResponseMock(status_code=404, json_data={"detail": "Not found."})

    msg = "Hauki API returned status 404 for date periods of '999'."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        HaukiAPIClient.get_date_periods(hauki_resource_id=999)
