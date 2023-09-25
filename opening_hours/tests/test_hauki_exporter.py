from unittest import mock

import pytest

from opening_hours.enums import ResourceType
from opening_hours.errors import HaukiAPIError
from opening_hours.resources import HaukiResource
from opening_hours.utils.hauki_exporter import ReservationUnitHaukiExporter

# ReservationUnitHaukiExporter._get_parent_id


@mock.patch("opening_hours.utils.hauki_exporter.HaukiAPIClient.get", return_value={"id": 1})
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id_returns_id(mocked_haukiapiclient_get, reservation_unit):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_id()

    assert parent_id == 1


@mock.patch("opening_hours.utils.hauki_exporter.HaukiAPIClient.get", return_value=None)
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id_return_none_when_parent_not_in_hauki(
    mocked_haukiapiclient_get,
    reservation_unit,
):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_id()

    assert parent_id is None


@mock.patch("opening_hours.utils.hauki_exporter.HaukiAPIClient.get", side_effect=HaukiAPIError())
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id_return_none_when_parent_not_in_hauki_and_request_errors(
    mocked_haukiapiclient_get,
    reservation_unit,
):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_id()

    assert parent_id is None


@mock.patch("opening_hours.utils.hauki_exporter.HaukiAPIClient.get", return_value={})
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id_return_none_when_no_results(mocked_haukiapiclient_get, reservation_unit):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_id()

    assert parent_id is None


# ReservationUnitHaukiExporter._get_hauki_resource_object_from_reservation_unit


@mock.patch("opening_hours.utils.hauki_exporter.HaukiAPIClient.get", return_value={"id": 1})
@pytest.mark.django_db()
def test__hauki_exporter__get_hauki_resource_object_from_reservation_unit_ok(
    mocked_haukiapiclient_get,
    reservation_unit,
):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    res_object = exporter._get_hauki_resource_object_from_reservation_unit()

    assert res_object is not None


@mock.patch("opening_hours.utils.hauki_exporter.HaukiAPIClient.get", return_value={"results": []})
@pytest.mark.django_db()
def test__hauki_exporter__get_hauki_resource_object_from_reservation_unit_raises_when_parent_id_is_none(
    mocked_haukiapiclient_get,
    reservation_unit,
):
    reservation_unit.unit.hauki_resource_id = None
    exporter = ReservationUnitHaukiExporter(reservation_unit)

    with pytest.raises(ValueError):  # noqa: PT011
        exporter._get_hauki_resource_object_from_reservation_unit()


# ReservationUnitHaukiExporter.send_reservation_unit_to_hauki


@mock.patch(
    "opening_hours.utils.hauki_exporter.send_resource_to_hauki",
    return_value=HaukiResource(
        id=1,
        name="",
        description="",
        address="",
        resource_type=ResourceType.RESERVABLE.value,
        children=[],
        parents=[],
        organization="",
        origin_id="",
        origin_data_source_name="",
        origin_data_source_id="",
    ),
)
@pytest.mark.django_db()
def test__hauki_exporter__send_reservation_unit_to_hauki_create_new_resource(
    mocked_haukiapiclient_post,
    reservation_unit,
):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    exporter.send_reservation_unit_to_hauki()

    assert mocked_haukiapiclient_post.call_count > 0

    reservation_unit.refresh_from_db()

    assert reservation_unit.hauki_resource_id == "1"


@mock.patch(
    "opening_hours.resources.HaukiAPIClient.put",
    return_value={
        "id": 1,
        "name": "",
        "description": "",
        "address": "",
        "resource_type": ResourceType.RESERVABLE.value,
        "children": [],
        "parents": [],
        "organization": "",
        "origins": [{"origin_id": "tvp", "data_source": {"name": "tvp", "id": "tvp"}}],
    },
)
@pytest.mark.django_db()
def test__hauki_exporter__send_reservation_unit_to_hauki_update_existing_resource(
    mocked_haukiapiclient_put,
    reservation_unit,
):
    reservation_unit.hauki_resource_id = 1
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    exporter.send_reservation_unit_to_hauki()

    assert mocked_haukiapiclient_put.call_count > 0

    reservation_unit.refresh_from_db()

    assert reservation_unit.hauki_resource_id == "1"
