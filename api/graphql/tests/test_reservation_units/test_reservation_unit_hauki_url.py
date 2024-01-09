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
        assert (
            content.get("data").get("reservationUnitHaukiUrl").get("url")
            == "https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/"
            "?hsa_source=origin"
            "&hsa_username=amin.general%40foo.com"
            "&hsa_organization=tprek%3Adepid"
            "&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00"
            "&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00"
            "&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710"
            "&hsa_has_organization_rights=true"
            "&hsa_signature=46f03c933a0f7e32bce2a79dc7e38df10c513fe439c8fd80cad73a273f476f28"
            "&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711"
        )

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
        assert (
            content.get("data").get("reservationUnitHaukiUrl").get("url")
            == "https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/"
            "?hsa_source=origin"
            "&hsa_username=amin.dee%40foo.com"
            "&hsa_organization=tprek%3Adepid"
            "&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00"
            "&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00"
            "&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710"
            "&hsa_has_organization_rights=true"
            "&hsa_signature=13936b91c1ff3334534b386a807459d6696343c32fe9872ea46e687693378cb2"
            "&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711"
        )

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
        assert (
            content.get("data").get("reservationUnitHaukiUrl").get("url")
            == "https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/"
            "?hsa_source=origin"
            "&hsa_username=amin.dee%40foo.com"
            "&hsa_organization=tprek%3Adepid"
            "&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00"
            "&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00"
            "&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710"
            "&hsa_has_organization_rights=true"
            "&hsa_signature=13936b91c1ff3334534b386a807459d6696343c32fe9872ea46e687693378cb2"
            "&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711"
        )

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
        assert content.get("errors")[0].get("message") == "No ReservationUnit matches the given query."
        assert content.get("data").get("reservationUnitHaukiUrl") is None

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
        assert content.get("errors")[0].get("message") == "Wrong identifier for reservation unit in url generation."
        assert content.get("data").get("reservationUnitHaukiUrl").get("url") is None

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
        assert (
            content.get("data").get("reservationUnitHaukiUrl").get("url")
            == "https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/"
            "?hsa_source=origin"
            "&hsa_username=amin.general%40foo.com"
            "&hsa_organization=tprek%3Adepid"
            "&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00"
            "&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00"
            "&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710"
            "&hsa_has_organization_rights=true"
            "&hsa_signature=46f03c933a0f7e32bce2a79dc7e38df10c513fe439c8fd80cad73a273f476f28"
            "&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711"
        )

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
        assert content.get("data").get("reservationUnitHaukiUrl").get("url") is None
