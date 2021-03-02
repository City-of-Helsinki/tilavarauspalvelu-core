from unittest import mock
from unittest.mock import MagicMock, Mock

import pytest
from django.test.testcases import TestCase

from spaces.importers.units import UnitImporter
from spaces.models import Location, Unit

response_mock = MagicMock()


class UnitImporterBaseTestCase(TestCase):
    @classmethod
    def get_response_data(self):
        data = [
            {
                "id": 1,
                "name_fi": "Test Unit",
                "desc_fi": "this is a description",
                "latitude": 78.123456,
                "longitude": 24.654321,
                "street_address_fi": "Teststreet 1",
                "address_zip": "00002",
                "address_city_fi": "Helsinki",
                "phone": "+358 1 234 45678, +358 9 876 54321",
                "email": "email@example.fi",
                "www_fi": "https://www.example.fi",
                "accessibility_phone": "+358 1 234 45670",
                "accessibility_email": "access@example.fi",
            },
            {
                "id": 2,
                "name_fi": "Test Unit Too",
                "desc_fi": "this is a description too",
                "latitude": 77.123456,
                "longitude": 22.654321,
                "street_address_fi": "Testikuja 2",
                "address_zip": "00002",
                "address_city_fi": "Helsinki",
                "phone": "+358 1 234 45678, +358 9 876 54321",
                "email": "email@example.fi",
                "www_fi": "https://www.example.fi",
                "accessibility_phone": "+358 1 234 45670",
                "accessibility_email": "access_too@example.fi",
            },
        ]
        return data

    @classmethod
    def setUpTestData(cls):
        response_mock.status_code = 200
        response_mock.json = Mock(return_value=cls.get_response_data())
        cls.importer = UnitImporter("")

    def check_unit_values_vs_data_values(self, unit, expected_values):
        """Helper method to assert the unit values against expected values"""
        self.assertEqual(unit.name, expected_values["name_fi"])
        self.assertEqual(unit.description, expected_values["desc_fi"])
        self.assertEqual(unit.web_page, expected_values["www_fi"])
        self.assertEqual(unit.email, expected_values["email"])
        self.assertEqual(unit.phone, expected_values["phone"])

    def check_location_values_vs_data_values(self, location, expected_values):
        """Helper method to assert the location values against expected values"""
        self.assertEqual(location.address_street, expected_values["street_address_fi"])
        self.assertEqual(location.address_zip, expected_values["address_zip"])
        self.assertEqual(location.address_city, expected_values["address_city_fi"])
        self.assertEqual(location.coordinates.x, expected_values["longitude"])
        self.assertEqual(location.coordinates.y, expected_values["latitude"])


@pytest.mark.django_db
@mock.patch("requests.get", return_value=response_mock)
class UnitImporterTestCase(UnitImporterBaseTestCase):
    def test_importer_creates_units(self, mock_response):
        self.importer.import_units()
        self.assertEqual(2, Unit.objects.count())

    def test_importer_creates_locations(self, mock_response):
        self.importer.import_units()
        self.assertEqual(2, Location.objects.count())

    def test_importer_creates_a_units_with_correct_values(self, mock_response):
        self.importer.import_units()
        data = self.get_response_data()

        unit_one = Unit.objects.get(service_map_id=1)
        self.check_unit_values_vs_data_values(unit_one, data[0])
        location_one = Location.objects.get(unit=unit_one)
        self.check_location_values_vs_data_values(location_one, data[0])

        unit_too = Unit.objects.get(service_map_id=2)
        self.check_unit_values_vs_data_values(unit_too, data[1])
        location_too = Location.objects.get(unit=unit_too)
        self.check_location_values_vs_data_values(location_too, data[1])

    def test_importer_updates_existing_unit(self, mock_response):
        self.importer.import_units()
        self.assertEqual(2, Unit.objects.count())

        unit = Unit.objects.get(service_map_id=1)
        location = Location.objects.get(unit=unit)

        data = self.get_response_data()
        self.check_unit_values_vs_data_values(unit, data[0])
        self.check_location_values_vs_data_values(location, data[0])

        data[0].update(
            {
                "id": 1,
                "name_fi": "Modification",
                "latitude": 44.123456,
                "longitude": 43.654321,
                "street_address_fi": "Modificationstreet 1",
                "address_zip": "00002",
                "address_city_fi": "Helsinki",
                "phone": "+358 1 234 45678, +358 9 876 54321",
                "email": "modified_email@example.fi",
                "www_fi": "https://www.modifiedexample.fi",
            }
        )
        mocked_response = MagicMock()
        mocked_response.json = Mock(return_value=data)
        mock_response.return_value = mocked_response

        self.importer.import_units()
        self.assertEqual(2, Unit.objects.count())

        unit.refresh_from_db()
        location.refresh_from_db()
        self.check_unit_values_vs_data_values(unit, data[0])
        self.check_location_values_vs_data_values(location, data[0])

    def test_importer_saves_coordinates_as_null_when_missing_data(self, mock_response):
        data = self.get_response_data()
        data.pop(1)
        data[0].update(
            {
                "id": 1,
                "name_fi": "Modification",
                "latitude": None,
                "longitude": None,
                "street_address_fi": "Modificationstreet 1",
                "address_zip": "00002",
                "address_city_fi": "Helsinki",
                "phone": "+358 1 234 45678, +358 9 876 54321",
                "email": "modified_email@example.fi",
                "www_fi": "https://www.modifiedexample.fi",
            }
        )
        mocked_response = MagicMock()
        mocked_response.json = Mock(return_value=data)
        mock_response.return_value = mocked_response


@pytest.mark.django_db
@mock.patch("requests.get", return_value=response_mock)
class UnitImporterDefaultsTestCase(UnitImporterBaseTestCase):
    @classmethod
    def get_field_map(self):
        field_map = {
            "unit": {
                "service_map_id": "id",
                "name": "name_fi",
                "description": "desc_fi",
                "web_page": "www_fi",
                "email": "email",
                "phone": "phone",
            },
            "location": {
                "address_street": "street_address_fi",
                "address_zip": "address_zip",
                "address_city": "address_city_fi",
                "lat": "latitude",
                "lon": "longitude",
            },
            "defaults": {
                "service_map_id": None,
                "name": None,
                "description": "",
                "web_page": "",
                "email": "",
                "phone": "",
                "address_street": None,
                "address_zip": None,
                "address_city": None,
                "lat": None,
                "lon": None,
            },
        }
        return field_map

    @classmethod
    def setUpTestData(cls):
        cls.data = cls.get_response_data()
        cls.data[0].pop("desc_fi")
        cls.data[0].pop("email")
        cls.data[0].pop("www_fi")
        cls.data[0].pop("phone")
        response_mock.json = Mock(return_value=cls.data)
        cls.importer = UnitImporter("", field_map=cls.get_field_map())

    def test_importer_uses_default_values_for_missing_fields_unit(self, mock_response):
        self.importer.import_units()
        unit = Unit.objects.get(service_map_id=1)

        check_values = {
            "name_fi": self.data[0]["name_fi"],
            "desc_fi": "",
            "www_fi": "",
            "email": "",
            "phone": "",
        }

        self.check_unit_values_vs_data_values(unit, check_values)

    def test_importer_fails_when_missing_fields_and_defaults_not_defined(
        self, mock_response
    ):
        field_map = self.get_field_map()
        field_map["defaults"] = {}
        importer = UnitImporter("", field_map=field_map)

        with self.assertRaises(Exception):
            importer.import_units()


@pytest.mark.django_db
@mock.patch("requests.get", return_value=response_mock)
class UnitImporterCustomFieldMapTestCase(UnitImporterBaseTestCase):
    def test_importer_giving_custom_field_map_creates_units_and_locations(
        self, mock_response
    ):
        importer = UnitImporter(
            "",
            field_map={
                "unit": {
                    "service_map_id": "id",
                    "name": "name",
                    "web_page": "www",
                    "email": "mail",
                    "phone": "tel",
                },
                "location": {
                    "address_street": "address",
                    "address_zip": "zip",
                    "address_city": "city",
                    "lat": "lat",
                    "lon": "lon",
                },
                "defaults": {
                    "service_map_id": None,
                    "name": "",
                    "web_page": "",
                    "email": "",
                    "phone": "",
                },
            },
        )
        data = [
            {
                "id": 1,
                "name": "Test Unit",
                "lat": 78.123456,
                "lon": 24.654321,
                "address": "Teststreet 1",
                "zip": "00002",
                "city": "Helsinki",
                "tel": "+358 1 234 45678, +358 9 876 54321",
                "mail": "email@example.fi",
                "www": "https://www.example.fi",
            }
        ]

        mocked_response = MagicMock()
        mocked_response.json = Mock(return_value=data)
        mock_response.return_value = mocked_response

        importer.import_units()

        unit = Unit.objects.get(service_map_id=1)
        self.assertEqual(unit.name, data[0]["name"])
        self.assertEqual(unit.web_page, data[0]["www"])
        self.assertEqual(unit.email, data[0]["mail"])
        self.assertEqual(unit.phone, data[0]["tel"])

        location = Location.objects.get(unit=unit)
        self.assertEqual(location.address_street, data[0]["address"])
        self.assertEqual(location.address_zip, data[0]["zip"])
        self.assertEqual(location.address_city, data[0]["city"])
        self.assertEqual(location.coordinates.x, data[0]["lon"])
        self.assertEqual(location.coordinates.y, data[0]["lat"])

    def test_importer_fails_with_mismatching_data_in_field_map(self, mock_response):
        importer = UnitImporter(
            "",
            field_map={
                "unit": {
                    "service_map_id": "iid",
                    "name": "name",  # mismatch
                    "web_page": "www",
                    "email": "mail",
                    "phone": "tel",
                },
                "location": {
                    "address_street": "address",
                    "address_zip": "zip",
                    "address_city": "city",
                    "lat": "lat",
                    "lon": "lat",
                },
                "defaults": {
                    "service_map_id": None,
                    "name": "",
                    "web_page": "",
                    "email": "",
                    "phone": "",
                },
            },
        )

        with self.assertRaises(Exception):
            importer.import_units()

    def test_importer_giving_custom_field_map_with_empty_defaults_creates_units_and_locations(
        self, mock_response
    ):
        importer = UnitImporter(
            "",
            field_map={
                "unit": {
                    "service_map_id": "id",
                    "name": "name",
                    "web_page": "www",
                    "email": "mail",
                    "phone": "tel",
                },
                "location": {
                    "address_street": "address",
                    "address_zip": "zip",
                    "address_city": "city",
                    "lat": "lat",
                    "lon": "lon",
                },
                "defaults": {},
            },
        )
        data = [
            {
                "id": 1,
                "name": "Test Unit",
                "address": "Teststreet 1",
                "zip": "00002",
                "city": "Helsinki",
                "tel": "+358 1 234 45678, +358 9 876 54321",
                "mail": "email@example.fi",
                "www": "https://www.example.fi",
            }
        ]

        mocked_response = MagicMock()
        mocked_response.json = Mock(return_value=data)
        mock_response.return_value = mocked_response

        importer.import_units()

        unit = Unit.objects.get(service_map_id=1)
        self.assertEqual(unit.name, data[0]["name"])
        self.assertEqual(unit.web_page, data[0]["www"])
        self.assertEqual(unit.email, data[0]["mail"])
        self.assertEqual(unit.phone, data[0]["tel"])

        location = Location.objects.get(unit=unit)
        self.assertEqual(location.address_street, data[0]["address"])
        self.assertEqual(location.address_zip, data[0]["zip"])
        self.assertEqual(location.address_city, data[0]["city"])
        self.assertIsNone(location.coordinates)
