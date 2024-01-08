import json

import snapshottest
from freezegun import freeze_time

from api.graphql.tests.base import GrapheneTestCaseBase
from api.graphql.tests.test_reservation_units.conftest import reservation_unit_hauki_url_query
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRoleChoice,
    UnitRolePermission,
)
from tests.factories import ReservationUnitFactory, ServiceSectorFactory, UnitFactory


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
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])

    def test_admin_can_get_the_url(self):
        self.client.force_login(self.general_admin)

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=self.reservation_unit.id,
                reservationUnits=[self.target_runit.id],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is None

        self.assertMatchSnapshot(content)

    def test_unit_admin_can_get_url(self):
        self.client.force_login(self.create_unit_admin(self.unit))
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_manage_units",
        )

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=self.reservation_unit.id,
                reservationUnits=[self.target_runit.id],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is None

        self.assertMatchSnapshot(content)

    def test_service_sector_admin_can_get_the_url(self):
        self.client.force_login(self.create_service_sector_admin(service_sector=self.service_sector))
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_manage_units",
        )

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=self.reservation_unit.id,
                reservationUnits=[self.target_runit.id],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is None

        self.assertMatchSnapshot(content)

    def test_getting_url_raises_error_if_reservation_unit_not_exist(self):
        self.client.force_login(self.general_admin)

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=666,
                reservationUnits=[self.target_runit.id],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is not None

        self.assertMatchSnapshot(content)  # data should be None.

    def test_getting_url_raises_error_if_one_of_target_reservation_unit_not_exist(self):
        self.client.force_login(self.general_admin)

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=self.reservation_unit.id,
                reservationUnits=[666],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is not None

        self.assertMatchSnapshot(content)  # data should be None.

    def test_url_does_not_contain_reservation_unit_not_in_same_unit(self):
        self.client.force_login(self.general_admin)
        res_unit = ReservationUnitFactory(unit=UnitFactory())

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=self.reservation_unit.id,
                reservationUnits=[self.target_runit.id, res_unit.id],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is None

        url = content.get("data").get("reservationUnitHaukiUrl").get("url")
        assert url is not None

        assert str(res_unit.uuid) not in url
        assert str(self.target_runit.uuid) in url

        self.assertMatchSnapshot(content)

    def test_regular_user_gets_none_url(self):
        self.client.force_login(self.regular_joe)

        response = self.query(
            reservation_unit_hauki_url_query(
                pk=self.reservation_unit.id,
                reservationUnits=[self.target_runit.id],
            )
        )

        content = json.loads(response.content)

        assert content.get("errors") is None

        self.assertMatchSnapshot(content)  # data should be None.
