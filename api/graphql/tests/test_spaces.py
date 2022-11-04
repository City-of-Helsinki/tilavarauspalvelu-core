import json

import snapshottest
from assertpy import assert_that
from factory.fuzzy import FuzzyChoice

from api.graphql.tests.base import GrapheneTestCaseBase
from applications.models import ApplicationRoundStatus
from applications.tests.factories import (
    ApplicationRoundFactory,
    ApplicationRoundStatusFactory,
)
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.models import Space
from spaces.tests.factories import ServiceSectorFactory, SpaceFactory, UnitFactory


class DeleteSpaceTestCase(GrapheneTestCaseBase):
    def setUp(self) -> None:
        super().setUp()

        round_open_status = ApplicationRoundStatusFactory(
            status=FuzzyChoice(
                choices=[
                    choice
                    for choice, _ in ApplicationRoundStatus.STATUS_CHOICES
                    if choice not in ApplicationRoundStatus.CLOSED_STATUSES
                ]
            )
        )
        round_closed_status = ApplicationRoundStatusFactory(
            status=FuzzyChoice(choices=ApplicationRoundStatus.CLOSED_STATUSES)
        )
        self.space = SpaceFactory(name="Test space")
        self.app_round = ApplicationRoundFactory()
        resunit = ReservationUnitFactory(spaces=[self.space])
        self.app_round.reservation_units.add(resunit)
        self.app_round.statuses.add(round_open_status)
        self.app_round.statuses.add(round_closed_status)
        self.client.force_login(self.general_admin)

    def get_delete_query(self):
        return (
            f"mutation deleteSpace {{deleteSpace(input: {{pk: {self.space.pk} }}){{"
            f"deleted errors"
            f"}}"
            f"}}"
        )

    def test_space_deleted(self):
        response = self.query(self.get_delete_query())

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_true()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_false()

    def test_space_not_deleted_because_in_active_round(self):
        self.app_round.statuses.filter(
            status__in=ApplicationRoundStatus.CLOSED_STATUSES
        ).delete()
        response = self.query(self.get_delete_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).contains(
            "Space occurs"
        )
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_false()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_true()

    def test_space_not_deleted_when_no_credentials(self):
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).contains(
            "No permissions to perform delete."
        )
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_false()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_true()

    def test_space_deleted_when_unit_admin(self):
        unit_admin = self.create_unit_admin(unit=self.space.unit)
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        )
        self.client.force_login(unit_admin)

        response = self.query(self.get_delete_query())

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_true()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_false()

    def test_space_not_deleted_when_unit_admin_have_no_manage_permissions(self):
        """This one is missing the "can_manage_spaces" permission"""
        unit_admin = self.create_unit_admin(unit=self.space.unit)
        self.client.force_login(unit_admin)

        response = self.query(self.get_delete_query())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_not_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_false()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_true()

    def test_space_deleted_when_service_sector_admin(self):
        service_sector = ServiceSectorFactory(units=[self.space.unit])
        service_sector_admin = self.create_service_sector_admin(
            service_sector=service_sector
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        )
        self.client.force_login(service_sector_admin)

        response = self.query(self.get_delete_query())

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_true()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_false()

    def test_space_not_deleted_when_service_sector_have_no_manage_permissions(self):
        """This one is missing the "can_manage_spaces" permission"""
        service_sector = ServiceSectorFactory(units=[self.space.unit])
        service_sector_admin = self.create_service_sector_admin(
            service_sector=service_sector
        )
        self.client.force_login(service_sector_admin)

        response = self.query(self.get_delete_query())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_not_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_false()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_true()

    def test_space_delete_when_general_admin_does_not_have_manage_permissions(self):
        GeneralRolePermission.objects.filter(
            role=GeneralRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        ).delete()

        response = self.query(self.get_delete_query())

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_not_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_false()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_true()


class CreateSpaceTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.unit = UnitFactory()
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])

    def setUp(self) -> None:
        self.client.force_login(self.general_admin)

    def get_create_query(self):
        return """
        mutation createSpace($input: SpaceCreateMutationInput!) {
            createSpace(input: $input) {
                pk
                errors {
                  field
                  messages
                }
            }
        }
        """

    def test_space_is_created(self):
        data = {"nameFi": "SpaceName"}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["createSpace"]["errors"]).is_none()
        assert_that(
            Space.objects.filter(id=content["data"]["createSpace"]["pk"]).exists()
        ).is_true()

    def test_no_name_fi_errors(self):
        data = {"nameSv": "SpaceName"}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)

    def test_empty_name_fi_errors(self):
        data = {"nameFi": ""}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content["data"]["createSpace"]["errors"][0]["messages"][0]
        ).contains("nameFi cannot be empty.")

    def test_spaced_name_fi_errors(self):
        data = {"nameFi": " "}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content["data"]["createSpace"]["errors"][0]["messages"][0]
        ).contains("nameFi cannot be empty.")

    def test_surface_area(self):
        data = {"nameFi": "SpaceName", "surfaceArea": 40.0}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["createSpace"]["errors"]).is_none()
        space = Space.objects.filter(id=content["data"]["createSpace"]["pk"]).first()
        assert_that(space).is_not_none()
        assert_that(space.surface_area).is_equal_to(40)

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        data = {"nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Space.objects.all().exists()).is_false()

    def test_space_created_when_unit_admin(self):
        unit_admin = self.create_unit_admin(unit=self.unit)
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        )
        self.client.force_login(unit_admin)

        data = {"nameFi": "SpaceName", "unitPk": self.unit.id}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["createSpace"]["errors"]).is_none()
        assert_that(
            Space.objects.filter(id=content["data"]["createSpace"]["pk"]).exists()
        ).is_true()

    def test_space_not_created_when_unit_admin_have_no_manage_permissions(self):
        """This one is missing the "can_manage_spaces" permission"""
        unit_admin = self.create_unit_admin(unit=self.unit)
        self.client.force_login(unit_admin)

        data = {"nameFi": "Woohoo I created a space!", "unitPk": self.unit.id}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Space.objects.all().exists()).is_false()

    def test_space_created_when_service_sector_admin(self):
        service_sector_admin = self.create_service_sector_admin(
            service_sector=self.service_sector
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        )
        self.client.force_login(service_sector_admin)

        data = {"nameFi": "SpaceName", "unitPk": self.unit.id}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["createSpace"]["errors"]).is_none()
        assert_that(
            Space.objects.filter(id=content["data"]["createSpace"]["pk"]).exists()
        ).is_true()

    def test_space_not_created_when_service_sector_have_no_manage_permissions(self):
        """This one is missing the "can_manage_spaces" permission"""
        service_sector = ServiceSectorFactory(units=[self.unit])
        service_sector_admin = self.create_service_sector_admin(
            service_sector=service_sector
        )
        self.client.force_login(service_sector_admin)

        data = {"nameFi": "SpaceName", "unitPk": self.unit.id}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Space.objects.all().exists()).is_false()

    def test_space_create_fails_when_general_admin_does_not_have_manage_permissions(
        self,
    ):
        GeneralRolePermission.objects.filter(
            role=GeneralRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        ).delete()

        data = {"nameFi": "SpaceName", "unitPk": self.unit.id}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Space.objects.all().exists()).is_false()


class UpdateSpaceTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.space = SpaceFactory(name="Space1")

    def setUp(self) -> None:
        self.client.force_login(self.general_admin)

    def get_update_query(self):
        return """
        mutation updateSpace($input: SpaceUpdateMutationInput!) {
            updateSpace(input: $input) {
                pk
                errors {
                  field
                  messages
                }
            }
        }
        """

    def test_space_is_updated(self):
        data = {"pk": self.space.pk, "nameEn": "SpaceName"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["updateSpace"]["errors"]).is_none()
        assert_that(
            Space.objects.get(id=content["data"]["updateSpace"]["pk"]).name_en
        ).is_equal_to("SpaceName")

    def test_empty_name_fi_errors(self):
        data = {"pk": self.space.pk, "nameFi": ""}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content["data"]["updateSpace"]["errors"][0]["messages"][0]
        ).contains("nameFi cannot be empty.")

    def test_spaced_name_fi_errors(self):
        data = {"pk": self.space.pk, "nameFi": " "}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content["data"]["updateSpace"]["errors"][0]["messages"][0]
        ).contains("nameFi cannot be empty.")

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        data = {"pk": self.space.pk, "nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.space.refresh_from_db()
        assert_that(self.space.name_fi).is_equal_to("Space1")

    def test_space_updated_when_unit_admin(self):
        unit_admin = self.create_unit_admin(unit=self.space.unit)
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        )
        self.client.force_login(unit_admin)

        data = {"pk": self.space.pk, "nameEn": "SpaceName"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["updateSpace"]["errors"]).is_none()
        assert_that(
            Space.objects.get(id=content["data"]["updateSpace"]["pk"]).name_en
        ).is_equal_to("SpaceName")

    def test_space_not_updated_when_unit_admin_have_no_manage_permissions(self):
        """This one is missing the "can_manage_spaces" permission"""
        unit_admin = self.create_unit_admin(unit=self.space.unit)
        self.client.force_login(unit_admin)

        data = {"pk": self.space.pk, "nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.space.refresh_from_db()
        assert_that(self.space.name_fi).is_equal_to("Space1")

    def test_space_updated_when_service_sector_admin(self):
        service_sector = ServiceSectorFactory(units=[self.space.unit])
        service_sector_admin = self.create_service_sector_admin(
            service_sector=service_sector
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        )
        self.client.force_login(service_sector_admin)

        data = {"pk": self.space.pk, "nameEn": "SpaceName"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content["data"]["updateSpace"]["errors"]).is_none()
        assert_that(
            Space.objects.get(id=content["data"]["updateSpace"]["pk"]).name_en
        ).is_equal_to("SpaceName")

    def test_space_not_updated_when_service_sector_have_no_manage_permissions(self):
        """This one is missing the "can_manage_spaces" permission"""
        service_sector = ServiceSectorFactory(units=[self.space.unit])
        service_sector_admin = self.create_service_sector_admin(
            service_sector=service_sector
        )
        self.client.force_login(service_sector_admin)

        data = {"pk": self.space.pk, "nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.space.refresh_from_db()
        assert_that(self.space.name_fi).is_equal_to("Space1")

    def test_space_update_fails_when_general_admin_does_not_have_manage_permissions(
        self,
    ):
        GeneralRolePermission.objects.filter(
            role=GeneralRoleChoice.objects.get(code="admin"),
            permission="can_manage_spaces",
        ).delete()

        data = {"pk": self.space.pk, "nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.space.refresh_from_db()
        assert_that(self.space.name_fi).is_equal_to("Space1")


class SpacesQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.space = SpaceFactory(name_fi="outerspace", surface_area=40.5)

    def test_spaces_query(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                spaces {
                    edges {
                        node {
                            nameFi
                            surfaceArea
                            code
                            maxPersons
                          }
                        }
                    }
                }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
