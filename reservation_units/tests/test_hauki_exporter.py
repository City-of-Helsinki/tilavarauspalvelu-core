from unittest import mock

from assertpy import assert_that
from django.test import override_settings
from django.test.testcases import TestCase

from opening_hours.enums import ResourceType
from opening_hours.errors import HaukiAPIError
from opening_hours.resources import Resource
from reservation_units.tests.factories import ReservationUnitFactory
from reservation_units.utils.hauki_exporter import ReservationUnitHaukiExporter
from spaces.tests.factories import UnitFactory


@mock.patch("reservation_units.utils.hauki_exporter.make_hauki_get_request")
class HaukiExporterTestCase(TestCase):
    def get_mocked_resource_response(self):
        return {"id": 1}

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        unit = UnitFactory(tprek_id=1234, tprek_department_id=4321, hauki_resource_id=1)
        cls.reservation_unit = ReservationUnitFactory(unit=unit)

    def test_get_parent_id_returns_id(self, hauki_mock):
        hauki_mock.return_value = self.get_mocked_resource_response()
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        parent_id = exporter._get_parent_id()

        assert_that(parent_id).is_equal_to(1)

    def test_get_parent_id_return_none_when_parent_not_in_hauki(self, hauki_mock):
        hauki_mock.return_value = None
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        parent_id = exporter._get_parent_id()

        assert_that(parent_id).is_none()

    def test_get_parent_id_return_none_when_parent_not_in_hauki_and_request_errors(
        self, hauki_mock
    ):
        hauki_mock.side_effect = HaukiAPIError()
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        parent_id = exporter._get_parent_id()

        assert_that(parent_id).is_none()

    def test_get_parent_id_return_none_when_no_results(self, hauki_mock):
        hauki_mock.return_value = {}
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        parent_id = exporter._get_parent_id()

        assert_that(parent_id).is_none()

    def test_get_hauki_resource_object_from_reservation_unit_ok(self, hauki_mock):
        hauki_mock.return_value = self.get_mocked_resource_response()
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        res_object = exporter._get_hauki_resource_object_from_reservation_unit()

        assert_that(res_object).is_not_none()

    def test_get_hauki_resource_object_from_reservation_unit_raises_when_parent_id_is_none(
        self, hauki_mock
    ):
        self.reservation_unit.unit.hauki_resource_id = None
        hauki_mock.return_value = hauki_mock.return_value = {"results": []}
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        with self.assertRaises(ValueError):
            exporter._get_hauki_resource_object_from_reservation_unit()

    @mock.patch("reservation_units.utils.hauki_exporter.send_resource_to_hauki")
    def test_send_reservation_unit_to_hauki_create_new_resource(
        self, send_mock, hauki_mock
    ):
        send_mock.return_value = Resource(
            id=1,
            name="",
            description="",
            address="",
            resource_type=ResourceType.RESERVABLE.value,
            children=[],
            parents=[],
            organization="",
            origin_id="",
            origin_data_source_name="",
            origin_data_source_id="",
        )
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        exporter.send_reservation_unit_to_hauki()
        assert_that(send_mock.call_count).is_greater_than(0)
        self.reservation_unit.refresh_from_db()
        assert_that(self.reservation_unit.hauki_resource_id).is_equal_to("1")

    @mock.patch("opening_hours.resources.make_hauki_put_request")
    @override_settings(HAUKI_API_KEY="SECRET", HAUKI_API_URL="urli")
    def test_send_reservation_unit_to_hauki_update_existing_resource(
        self, send_mock, hauki_mock
    ):
        send_mock.return_value = {
            "id": 1,
            "name": "",
            "description": "",
            "address": "",
            "resource_type": ResourceType.RESERVABLE.value,
            "children": [],
            "parents": [],
            "organization": "",
            "origins": [
                {"origin_id": "tvp", "data_source": {"name": "tvp", "id": "tvp"}}
            ],
        }
        self.reservation_unit.hauki_resource_id = 1
        exporter = ReservationUnitHaukiExporter(self.reservation_unit)
        exporter.send_reservation_unit_to_hauki()
        assert_that(send_mock.call_count).is_greater_than(0)
        self.reservation_unit.refresh_from_db()
        assert_that(self.reservation_unit.hauki_resource_id).is_equal_to("1")
