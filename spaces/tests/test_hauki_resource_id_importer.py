import pytest
from django.test import override_settings

from opening_hours.utils.hauki_api_client import HaukiAPIClient
from spaces.importers.units import UnitHaukiResourceIdImporter
from tests.factories import UnitFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]

RET_VAL = {
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
RETURN_VALUES = [RET_VAL, SECOND_RET_VAL]


@override_settings(HAUKI_API_URL="url")
@patch_method(HaukiAPIClient.get, side_effect=RETURN_VALUES)
def test__hauki_resource_id_importer__from_unit_id():
    unit = UnitFactory(tprek_id=1)
    importer = UnitHaukiResourceIdImporter()
    importer.import_hauki_resource_ids_for_units(unit_ids=[unit.id])
    unit.refresh_from_db()

    assert unit.origin_hauki_resource.id == 1
    assert HaukiAPIClient.get.call_count == 2


@override_settings(HAUKI_API_URL="url")
@patch_method(HaukiAPIClient.get, side_effect=RETURN_VALUES)
def test__hauki_resource_id_importer__from_tprek_id():
    unit = UnitFactory(tprek_id=1)
    importer = UnitHaukiResourceIdImporter()
    importer.import_hauki_resource_ids_for_units(tprek_ids=[unit.tprek_id])
    unit.refresh_from_db()

    assert unit.origin_hauki_resource.id == 1
    assert HaukiAPIClient.get.call_count == 2
