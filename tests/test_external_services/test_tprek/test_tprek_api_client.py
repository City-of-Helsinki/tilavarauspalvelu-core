from tilavarauspalvelu.utils.importers.tprek_api_client import TprekAPIClient
from utils.date_utils import local_datetime

from tests.helpers import patch_method
from tests.mocks import MockResponse
from tests.test_external_services.test_tprek.helpers import SINGLE_TPREK_UNIT_JSON


@patch_method(
    TprekAPIClient.get,
    return_value=MockResponse(
        status_code=200,
        json=SINGLE_TPREK_UNIT_JSON,
    ),
)
def test_TprekAPIClient__get_unit():
    unit_data, location_data = TprekAPIClient.get_unit(unit_tprek_id="999")

    assert unit_data.tprek_id == "999"
    assert unit_data.name == "Test Unit"
    assert unit_data.name_fi == "Test Unit"
    assert unit_data.name_en is None
    assert unit_data.name_sv == "Test Unit Swedish"
    assert unit_data.description == "this is a description"
    assert unit_data.short_description == "this is a short description"
    assert unit_data.web_page == "https://www.example.fi"
    assert unit_data.email == "email@example.fi"
    assert unit_data.phone == "+358 1 234 45678, +358 9 876 54321"
    assert unit_data.tprek_department_id == "test-department-id"
    assert unit_data.tprek_last_modified == local_datetime(2023, 5, 10, 8, 9, 0)

    assert location_data.address_street == "Teststreet 1"
    assert location_data.address_street_fi == "Teststreet 1"
    assert location_data.address_street_en == "Teststreet 1"
    assert location_data.address_street_sv == "Testvägen 1"
    assert location_data.address_zip == "00002"
    assert location_data.address_city == "Helsinki"
    assert location_data.address_city_fi == "Helsinki"
    assert location_data.address_city_en == "Helsinki"
    assert location_data.address_city_sv == "Helsingfors"

    assert location_data.coordinates is not None
    assert location_data.coordinates.x == 24.654321
    assert location_data.coordinates.y == 78.123456


@patch_method(TprekAPIClient.get)
@patch_method(TprekAPIClient.response_json, return_value=None)
def test_TprekAPIClient__nonexistent_unit():
    unit_data, location_data = TprekAPIClient.get_unit(unit_tprek_id="999")
    assert unit_data is None
    assert location_data is None
