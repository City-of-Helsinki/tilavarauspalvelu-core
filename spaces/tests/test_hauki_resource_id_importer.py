from unittest import mock

from django.test import override_settings
from django.test.testcases import TestCase

from spaces.importers.units import UnitHaukiResourceIdImporter
from tests.factories import UnitFactory

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
@mock.patch("spaces.importers.units.HaukiAPIClient.get", side_effect=RETURN_VALUES)
class HaukiResourceIdImporterTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.unit = UnitFactory(tprek_id=1)

    def test_resource_id_is_imported_from_unit_ids(self, mock):
        importer = UnitHaukiResourceIdImporter()
        importer.import_hauki_resource_ids_for_units(unit_ids=[self.unit.id])
        self.unit.refresh_from_db()
        assert self.unit.origin_hauki_resource.id == 1
        assert mock.call_count == 2

    def test_resource_id_is_importer_from_tprek_ids(self, mock):
        importer = UnitHaukiResourceIdImporter()
        importer.import_hauki_resource_ids_for_units(tprek_ids=[self.unit.tprek_id])
        self.unit.refresh_from_db()
        assert self.unit.origin_hauki_resource.id == 1
        assert mock.call_count == 2
