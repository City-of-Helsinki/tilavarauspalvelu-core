from __future__ import annotations

import pytest

from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.importers.tprek_unit_importer import TprekUnitHaukiResourceIdImporter

from tests.factories import OriginHaukiResourceFactory, UnitFactory
from tests.helpers import patch_method
from tests.mocks import MockResponse

pytestmark = [
    pytest.mark.django_db,
]

FIRST_RET_VAL = {
    "count": 1,
    "next": "NotNone",
    "previous": None,
    "results": [
        {
            "id": 1,
            "origins": [{"data_source": {"id": "tprek"}, "origin_id": "1"}],
        }
    ],
}
SECOND_RET_VAL = {
    "count": 1,
    "next": None,
    "previous": None,
    "results": [
        {
            "id": 2,
            "origins": [{"data_source": {"id": "tprek"}, "origin_id": "2"}],
        }
    ],
}


@patch_method(
    HaukiAPIClient.get,
    side_effect=[
        MockResponse(status_code=200, json=FIRST_RET_VAL),
        MockResponse(status_code=200, json=SECOND_RET_VAL),
    ],
)
def test__tprek_unit_hauki_resource_importer__multiple_pages():
    unit_1 = UnitFactory.create(tprek_id=1)
    unit_2 = UnitFactory.create(tprek_id=2)

    TprekUnitHaukiResourceIdImporter.import_hauki_resources_for_units(units=[unit_1, unit_2])

    unit_1.refresh_from_db()
    unit_2.refresh_from_db()

    assert unit_1.origin_hauki_resource.id == 1
    assert unit_2.origin_hauki_resource.id == 2
    assert HaukiAPIClient.get.call_count == 2


@patch_method(HaukiAPIClient.get, side_effect=[MockResponse(status_code=200, json=SECOND_RET_VAL)])
def test__tprek_unit_hauki_resource_importer__all_resources_not_found():
    unit_1 = UnitFactory.create(tprek_id=1)
    unit_2 = UnitFactory.create(tprek_id=2)

    TprekUnitHaukiResourceIdImporter.import_hauki_resources_for_units(units=[unit_1, unit_2])

    unit_1.refresh_from_db()
    unit_2.refresh_from_db()

    assert unit_1.origin_hauki_resource is None
    assert unit_2.origin_hauki_resource.id == 2
    assert HaukiAPIClient.get.call_count == 1


@patch_method(HaukiAPIClient.get)
def test__tprek_unit_hauki_resource_importer__origin_hauki_resource__already_exists():
    unit = UnitFactory.create(tprek_id=888, origin_hauki_resource=OriginHaukiResourceFactory.create())

    TprekUnitHaukiResourceIdImporter.import_hauki_resources_for_units(units=[unit])

    assert HaukiAPIClient.get.call_count == 0
