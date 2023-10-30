from unittest import mock

import pytest

from opening_hours.enums import ResourceType
from opening_hours.errors import HaukiAPIError
from opening_hours.utils.hauki_exporter import ReservationUnitHaukiExporter
from reservation_units.models import ReservationUnit

##################
# _get_parent_id #
##################


# Parent ID got from ReservationUnit.unit.origin_hauki_resource
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id__ok__unit_has_origin_hauki_resource(reservation_unit):
    assert reservation_unit.unit.origin_hauki_resource.id == 888
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_resource_id()

    assert parent_id == 888


@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resource", return_value={"id": 1})
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id__ok__fetched_from_hauki_api(mocked_get, reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_resource_id()

    assert parent_id == 1


@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id__fail__no_unit(reservation_unit):
    reservation_unit.unit = None
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_resource_id()

    assert parent_id is None


@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resource", return_value=None)
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id__fail__does_not_exist_in_hauki_api(mocked_get, reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_resource_id()

    assert parent_id is None


@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resource", side_effect=HaukiAPIError())
@pytest.mark.django_db()
def test__hauki_exporter__get_parent_id__fail__hauki_api_error(mocked_get, reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    parent_id = exporter._get_parent_resource_id()

    assert parent_id is None


####################################################
# _convert_reservation_unit_to_hauki_resource_data #
####################################################


@mock.patch("opening_hours.utils.hauki_api_client.HaukiAPIClient.get_resource", return_value={"id": 1})
@pytest.mark.django_db()
def test__hauki_exporter__convert_reservation_unit_to_hauki_resource(mocked_get, reservation_unit):
    exporter = ReservationUnitHaukiExporter(reservation_unit)
    res_object = exporter._convert_reservation_unit_to_hauki_resource_data()

    assert res_object is not None


##################################
# send_reservation_unit_to_hauki #
##################################

_mocked_send_return_value = {
    "id": 222,
    "name": "",
    "description": "",
    "address": "",
    "resource_type": ResourceType.RESERVABLE.value,
    "children": [],
    "parents": [],
    "organization": "",
    "origins": [
        {
            "origin_id": "tvp",
            "data_source": {"name": "tvp", "id": "tvp"},
        },
    ],
    "extra_data": {},
    "is_public": True,
    "timezone": "Europe/Helsinki",
}


@mock.patch(
    "opening_hours.utils.hauki_api_client.HaukiAPIClient.create_resource",
    return_value=_mocked_send_return_value,
)
@pytest.mark.django_db()
def test__hauki_exporter__send_reservation_unit_to_hauki__create_new_resource(mocked_create, reservation_unit):
    reservation_unit.origin_hauki_resource = None

    ReservationUnitHaukiExporter(reservation_unit).send_reservation_unit_to_hauki()

    assert mocked_create.call_count > 0
    assert ReservationUnit.objects.first().origin_hauki_resource.id == 222


@mock.patch(
    "opening_hours.utils.hauki_api_client.HaukiAPIClient.update_resource",
    return_value=_mocked_send_return_value,
)
@pytest.mark.django_db()
def test__hauki_exporter__send_reservation_unit_to_hauki__update_existing_resource(mocked_update, reservation_unit):
    ReservationUnitHaukiExporter(reservation_unit).send_reservation_unit_to_hauki()

    assert mocked_update.call_count > 0
