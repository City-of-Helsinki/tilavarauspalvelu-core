import datetime

import pytest
from django.utils.timezone import get_default_timezone

from common.date_utils import local_datetime
from spaces.importers.tprek_api_client import TprekAPIClient
from spaces.importers.tprek_unit_importer import TprekUnitImporter
from spaces.models import Location
from tests.factories import UnitFactory
from tests.helpers import patch_method
from tests.mocks import MockResponse
from tests.test_external_services.test_tprek.conftest import SINGLE_TPREK_UNIT_JSON
from utils.sentry import SentryLogger

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


DEFAULT_TIMEZONE = get_default_timezone()


@patch_method(TprekAPIClient.get_unit, return_value=(None, None))
def test_TprekUnitImporter__unit_tprek_id_missing():
    unit = UnitFactory.create(tprek_id=None)

    importer = TprekUnitImporter()
    with pytest.raises(ValueError, match=f"Unit TPREK ID is None: {unit.pk}"):
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


@patch_method(TprekAPIClient.get, return_value=MockResponse(status_code=200, json=SINGLE_TPREK_UNIT_JSON))
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
    assert unit.tprek_last_modified.astimezone(get_default_timezone()) == local_datetime(2023, 5, 10, 8, 9, 0)

    location = Location.objects.get(unit=unit)
    assert location.address_street == "Teststreet 1"
    assert location.address_street_fi == "Teststreet 1"
    assert location.address_street_en == "Teststreet 1"
    assert location.address_street_sv == "Testvägen 1"
    assert location.address_zip == "00002"
    assert location.address_city == "Helsinki"
    assert location.address_city_fi == "Helsinki"
    assert location.address_city_en == "Helsinki"
    assert location.address_city_sv == "Helsingfors"
    assert location.coordinates is not None
    assert location.coordinates.x == 24.654321
    assert location.coordinates.y == 78.123456


@patch_method(TprekAPIClient.get, return_value=MockResponse(status_code=200, json=SINGLE_TPREK_UNIT_JSON))
def test_TprekUnitImporter__update_unit_data_from_tprek__saved_last_modified_is_older__update():
    modified = datetime.datetime.fromisoformat(SINGLE_TPREK_UNIT_JSON["modified_time"]).replace(tzinfo=DEFAULT_TIMEZONE)
    modified -= datetime.timedelta(days=1)
    unit = UnitFactory.create(name="Original name", tprek_id="999", tprek_last_modified=modified)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 1

    unit.refresh_from_db()
    assert unit.name == "Test Unit"


@patch_method(TprekAPIClient.get, return_value=MockResponse(status_code=200, json=SINGLE_TPREK_UNIT_JSON))
def test_TprekUnitImporter__update_unit_data_from_tprek__saved_last_modified_is_the_same__no_update():
    modified = datetime.datetime.fromisoformat(SINGLE_TPREK_UNIT_JSON["modified_time"]).replace(tzinfo=DEFAULT_TIMEZONE)
    unit = UnitFactory.create(name="Original name", tprek_id="999", tprek_last_modified=modified)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit])

    assert importer.updated_units_count == 0

    unit.refresh_from_db()
    assert unit.name == "Original name"


@patch_method(TprekAPIClient.get, return_value=MockResponse(status_code=200, json=SINGLE_TPREK_UNIT_JSON))
def test_TprekUnitImporter__update_unit_data_from_tprek__saved_last_modified_is_the_same__force_update():
    modified = datetime.datetime.fromisoformat(SINGLE_TPREK_UNIT_JSON["modified_time"]).replace(tzinfo=DEFAULT_TIMEZONE)
    unit = UnitFactory.create(name="Original name", tprek_id="999", tprek_last_modified=modified)

    importer = TprekUnitImporter()
    importer.update_unit_from_tprek([unit], force_update=True)

    assert importer.updated_units_count == 1

    unit.refresh_from_db()
    assert unit.name == "Test Unit"
