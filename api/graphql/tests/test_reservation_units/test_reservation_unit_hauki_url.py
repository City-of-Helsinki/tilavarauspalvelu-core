import json

import snapshottest
from assertpy import assert_that
from django.test import override_settings
from freezegun import freeze_time

from api.graphql.tests.base import GrapheneTestCaseBase
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRoleChoice,
    UnitRolePermission,
)
from tests.factories import ReservationUnitFactory, ServiceSectorFactory, UnitFactory


@override_settings(
    HAUKI_SECRET="HAUKISECRET",
    HAUKI_ADMIN_UI_URL="https://test.com",
    HAUKI_ORIGIN_ID="origin",
)
@freeze_time("2021-05-03")
class ReservationUnitHaukiUrlTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        GeneralRolePermission.objects.create(
            role=GeneralRoleChoice.objects.get(code="admin"),
            permission="can_manage_units",
        )

        cls.unit = UnitFactory(tprek_department_id="depid")
        cls.reservation_unit = ReservationUnitFactory(unit=cls.unit, uuid="3774af34-9916-40f2-acc7-68db5a627710")
        cls.target_runit = ReservationUnitFactory(unit=cls.unit, uuid="3774af34-9916-40f2-acc7-68db5a627711")
        cls.target_reservation_unit_ids = [str(cls.target_runit.id)]
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])

    def get_query(self, res_unit_id=None, target_reservation_unit_ids=None):
        target_reservation_unit_ids = target_reservation_unit_ids or self.target_reservation_unit_ids

        target_res_units = ",".join(list(target_reservation_unit_ids))

        res_unit_id = res_unit_id or self.reservation_unit.id

        return """
            query {
                reservationUnitHaukiUrl(pk: %s reservationUnits: [%s]) {
                    url
                }
            }
        """ % (
            res_unit_id,
            target_res_units,
        )

    def test_admin_can_get_the_url(self):
        self.maxDiff = None
        self.client.force_login(self.general_admin)

        response = self.query(self.get_query())

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_unit_admin_can_get_url(self):
        self.client.force_login(self.create_unit_admin(self.unit))
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_manage_units",
        )

        response = self.query(self.get_query())

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_service_sector_admin_can_get_the_url(self):
        self.client.force_login(self.create_service_sector_admin(service_sector=self.service_sector))
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_manage_units",
        )

        response = self.query(self.get_query())

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_url_raises_error_if_reservation_unit_not_exist(self):
        self.client.force_login(self.general_admin)
        response = self.query(self.get_query(res_unit_id="666"))

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()

        self.assertMatchSnapshot(content)  # data should be None.

    def test_getting_url_raises_error_if_one_of_target_reservation_unit_not_exist(self):
        self.client.force_login(self.general_admin)
        response = self.query(self.get_query(target_reservation_unit_ids=["666"]))

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()

        self.assertMatchSnapshot(content)  # data should be None.

    def test_url_does_not_contain_reservation_unit_not_in_same_unit(self):
        self.client.force_login(self.general_admin)
        res_unit = ReservationUnitFactory(unit=UnitFactory())
        target_res_units = self.target_reservation_unit_ids + [str(res_unit.id)]
        response = self.query(self.get_query(target_reservation_unit_ids=target_res_units))

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        url = content.get("data").get("reservationUnitHaukiUrl").get("url")
        assert_that(url).is_not_empty()

        assert_that(url).does_not_contain(str(res_unit.uuid))
        assert_that(url).contains(str(self.target_runit.uuid))

        assert_that(content.get(""))

        self.assertMatchSnapshot(content)

    def test_regular_user_gets_none_url(self):
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_query())

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)  # data should be None.
