from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import exact, patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def reservation_unit() -> ReservationUnit:
    return ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999, opening_hours_hash="abc123"),
        unit__tprek_id=1234,
        unit__tprek_department_id=4321,
        unit__origin_hauki_resource=OriginHaukiResourceFactory.create(id=888),
    )


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


# ── send_reservation_unit_to_hauki: parent resource ──


@patch_method(HaukiAPIClient.get_resource, return_value={"id": 1})
@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__parent_is_fetched_from_hauki_api(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None

    reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.get_resource.call_args.kwargs == {"hauki_resource_id": "tprek:1234"}
    data = HaukiAPIClient.update_resource.call_args.kwargs["data"]
    assert data["parents"] == [1]


@patch_method(HaukiAPIClient.get_resource, return_value=None)
@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__parent_does_not_exist_in_hauki_api(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None

    msg = "Parent Unit does have 'Hauki Resource' set and could not get it from Hauki API."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.update_resource.call_count == 0


@patch_method(HaukiAPIClient.get_resource, return_value={"id": 1})
@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__parent_without_tprek_id(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None
    reservation_unit.unit.tprek_id = None

    msg = "Parent Unit does have 'Hauki Resource' set and could not get it from Hauki API."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.get_resource.call_count == 0
    assert HaukiAPIClient.update_resource.call_count == 0


@patch_method(HaukiAPIClient.get_resource, side_effect=HaukiAPIError("foo"))
@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__hauki_api_error_when_fetching_parent(reservation_unit):
    reservation_unit.unit.origin_hauki_resource = None

    msg = "Parent Unit does have 'Hauki Resource' set and could not get it from Hauki API."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.update_resource.call_count == 0


# ── send_reservation_unit_to_hauki: resource data ──


@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__sends_reservation_unit_data(reservation_unit):
    reservation_unit.actions.send_reservation_unit_to_hauki()

    data = HaukiAPIClient.update_resource.call_args.kwargs["data"]
    assert data == {
        "id": 999,
        "name": {
            "fi": reservation_unit.name_fi,
            "sv": reservation_unit.name_sv,
            "en": reservation_unit.name_en,
        },
        "description": {
            "fi": reservation_unit.description,
            "sv": reservation_unit.description,
            "en": reservation_unit.description,
        },
        "resource_type": "reservable",
        "origins": [
            {
                "data_source": {"id": "tvp", "name": "Tilavarauspalvelu"},
                "origin_id": str(reservation_unit.ext_uuid),
            },
        ],
        "parents": [888],
        "organization": "tprek:4321",
        "address": None,
        "children": [],
        "extra_data": {},
        "is_public": True,
        "timezone": "Europe/Helsinki",
    }


@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__unit_without_department_id(reservation_unit):
    reservation_unit.unit.tprek_department_id = None

    msg = "Parent Unit does not have a department id."
    with pytest.raises(HaukiAPIError, match=exact(msg)):
        reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.update_resource.call_count == 0


# ── send_reservation_unit_to_hauki: create or update ──


@patch_method(HaukiAPIClient.create_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__create_new_resource(reservation_unit):
    reservation_unit.origin_hauki_resource = None

    reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.create_resource.call_count == 1
    reservation_unit.refresh_from_db()
    assert reservation_unit.origin_hauki_resource.id == 222


@patch_method(HaukiAPIClient.update_resource, return_value=_mocked_send_return_value)
def test__hauki_exporter__send_reservation_unit_to_hauki__update_existing_resource(reservation_unit):
    reservation_unit.actions.send_reservation_unit_to_hauki()

    assert HaukiAPIClient.update_resource.call_count == 1
    reservation_unit.refresh_from_db()
    assert reservation_unit.origin_hauki_resource.id == 999
