from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.exceptions import TPRekImportError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.tprek.tprek_api_client import TprekAPIClient
from tilavarauspalvelu.integrations.tprek.tprek_unit_importer import TprekUnitHaukiResourceIdImporter, TprekUnitImporter
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import UnitFactory
from tests.helpers import ResponseMock, patch_method
from tests.test_integrations.test_tprek.helpers import SINGLE_TPREK_UNIT_JSON

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(TprekAPIClient.get_unit, return_value=(None, None))
def test_TprekUnitImporter__unit_tprek_id_missing():
    unit = UnitFactory.create(tprek_id=None)

    importer = TprekUnitImporter()
    with pytest.raises(TPRekImportError):
        importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 0


@patch_method(SentryLogger.log_message)
@patch_method(TprekAPIClient.get_unit, return_value=(None, None))
def test_TprekUnitImporter__unit_not_found_in_tprek():
    unit = UnitFactory.create(tprek_id="999")

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 0
    assert SentryLogger.log_message.call_count == 1


@patch_method(TprekAPIClient.get, return_value=ResponseMock(status_code=200, json_data=SINGLE_TPREK_UNIT_JSON))
@patch_method(TprekUnitHaukiResourceIdImporter.import_hauki_resources_for_units)
def test_TprekUnitImporter__update_unit_data_from_tprek__no_last_modified_set__update():
    unit = UnitFactory.create(name="Original name", name_sv=None, tprek_id="999", tprek_last_modified=None)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 1

    unit.refresh_from_db()
    assert unit.tprek_id == "999"
    assert unit.name == "Test Unit"
    assert unit.name_fi == "Test Unit"
    assert unit.name_en is None
    assert unit.name_sv == "Test Unit Swedish"
    assert unit.description == "this is a description"
    assert unit.short_description == "this is a short description"
    assert unit.web_page == "https://www.example.fi"
    assert unit.email == "email@example.fi"
    assert unit.phone == "+358 1 234 45678, +358 9 876 54321"
    assert unit.tprek_department_id == "test-department-id"
    assert unit.tprek_last_modified.astimezone(tz=DEFAULT_TIMEZONE) == local_datetime(2023, 5, 10, 8, 9, 0)
    assert unit.address_street == "Teststreet 1"
    assert unit.address_street_fi == "Teststreet 1"
    assert unit.address_street_en == "Teststreet 1"
    assert unit.address_street_sv == "Testvägen 1"
    assert unit.address_zip == "00002"
    assert unit.address_city == "Helsinki"
    assert unit.address_city_fi == "Helsinki"
    assert unit.address_city_en == "Helsinki"
    assert unit.address_city_sv == "Helsingfors"
    assert unit.coordinates is not None
    assert unit.coordinates.x == 24.654321
    assert unit.coordinates.y == 78.123456


@patch_method(TprekAPIClient.get, return_value=ResponseMock(status_code=200, json_data=SINGLE_TPREK_UNIT_JSON))
@patch_method(TprekUnitHaukiResourceIdImporter.import_hauki_resources_for_units)
def test_TprekUnitImporter__update_unit_data_from_tprek__saved_last_modified_is_older__update():
    modified = datetime.datetime.fromisoformat(SINGLE_TPREK_UNIT_JSON["modified_time"]).replace(tzinfo=DEFAULT_TIMEZONE)
    modified -= datetime.timedelta(days=1)
    unit = UnitFactory.create(name="Original name", tprek_id="999", tprek_last_modified=modified)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 1

    unit.refresh_from_db()
    assert unit.name == "Test Unit"


@patch_method(TprekAPIClient.get, return_value=ResponseMock(status_code=200, json_data=SINGLE_TPREK_UNIT_JSON))
def test_TprekUnitImporter__update_unit_data_from_tprek__saved_last_modified_is_the_same__no_update():
    modified = datetime.datetime.fromisoformat(SINGLE_TPREK_UNIT_JSON["modified_time"]).replace(tzinfo=DEFAULT_TIMEZONE)
    unit = UnitFactory.create(name="Original name", tprek_id="999", tprek_last_modified=modified)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 0

    unit.refresh_from_db()
    assert unit.name == "Original name"


@patch_method(TprekAPIClient.get, return_value=ResponseMock(status_code=200, json_data=SINGLE_TPREK_UNIT_JSON))
@patch_method(TprekUnitHaukiResourceIdImporter.import_hauki_resources_for_units)
def test_TprekUnitImporter__update_unit_data_from_tprek__saved_last_modified_is_the_same__force_update():
    modified = datetime.datetime.fromisoformat(SINGLE_TPREK_UNIT_JSON["modified_time"]).replace(tzinfo=DEFAULT_TIMEZONE)
    unit = UnitFactory.create(name="Original name", tprek_id="999", tprek_last_modified=modified)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit], force_update=True)

    assert importer.updated_units_count == 1

    unit.refresh_from_db()
    assert unit.name == "Test Unit"
