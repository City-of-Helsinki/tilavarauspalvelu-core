import pytest

from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# TODO: Remove the need to have this fixture in this file
@pytest.fixture
def reservation_unit() -> ReservationUnit:
    return ReservationUnitFactory(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999, opening_hours_hash="abc123"),
        unit__tprek_id=1234,
        unit__tprek_department_id=4321,
        unit__origin_hauki_resource=OriginHaukiResourceFactory.create(id=888),
    )


##################
# _get_parent_id #
##################


# Parent ID got from ReservationUnit.unit.origin_hauki_resource
def test__hauki_exporter__get_parent_id__ok__unit_has_origin_hauki_resource(reservation_unit):
    assert reservation_unit.unit.origin_hauki_resource.id == 888
    parent_id = reservation_unit.actions._get_parent_resource_id()

    assert parent_id == 888


@patch_method(HaukiAPIClient.get_resource, return_value={"id": 1})
def test__hauki_exporter__get_parent_id__ok__fetched_from_hauki_api(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    parent_id = reservation_unit.actions._get_parent_resource_id()

    assert parent_id == 1


def test__hauki_exporter__get_parent_id__fail__no_unit(reservation_unit):
    reservation_unit.unit = None
    parent_id = reservation_unit.actions._get_parent_resource_id()

    assert parent_id is None


@patch_method(HaukiAPIClient.get_resource, return_value=None)
def test__hauki_exporter__get_parent_id__fail__does_not_exist_in_hauki_api(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    parent_id = reservation_unit.actions._get_parent_resource_id()

    assert parent_id is None


@patch_method(HaukiAPIClient.get_resource, side_effect=HaukiAPIError("foo"))
def test__hauki_exporter__get_parent_id__fail__hauki_api_error(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    parent_id = reservation_unit.actions._get_parent_resource_id()

    assert parent_id is None


####################################################
# _convert_reservation_unit_to_hauki_resource_data #
####################################################


@patch_method(HaukiAPIClient.get_resource, return_value={"id": 1})
def test__hauki_exporter__convert_reservation_unit_to_hauki_resource(reservation_unit):
    res_object = reservation_unit.actions._convert_reservation_unit_to_hauki_resource_data()

    assert res_object is not None


##################################
# send_reservation_unit_to_hauki #
##################################

_mocked_send_return_value = {
    "id": 222,
    "name": "",
    "description": "",
    "address": "",
    "resource_type": "reservable",
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


@patch_method(HaukiAPIClient.create_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__create_new_resource(reservation_unit):
    reservation_unit.origin_hauki_resource = None

    reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.create_resource.call_count > 0
    assert ReservationUnit.objects.first().origin_hauki_resource.id == 222


@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__update_existing_resource(reservation_unit):
    reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.update_resource.call_count > 0
