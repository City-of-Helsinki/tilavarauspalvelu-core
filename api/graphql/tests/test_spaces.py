import json

from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from applications.tests.factories import ApplicationRoundFactory
from permissions.models import GeneralRole, GeneralRoleChoice
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.models import Space
from spaces.tests.factories import SpaceFactory


class SpaceMutationBaseTestCase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        cls.general_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )

        cls.regular_user = get_user_model().objects.create(
            username="regjoe",
            first_name="Joe",
            last_name="Regular",
            email="regular.joe@foo.com",
        )

        GeneralRole.objects.create(
            user=cls.general_admin,
            role=GeneralRoleChoice.objects.get(code="admin"),
        )


class DeleteSpaceTestCase(SpaceMutationBaseTestCase):
    def setUp(self) -> None:
        self.space = SpaceFactory(name="Test space")
        self._client.force_login(self.general_admin)

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
        app_round = ApplicationRoundFactory()
        resunit = ReservationUnitFactory(spaces=[self.space])
        app_round.reservation_units.add(resunit)

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
        self._client.force_login(self.regular_user)

        app_round = ApplicationRoundFactory()
        resunit = ReservationUnitFactory(spaces=[self.space])
        app_round.reservation_units.add(resunit)

        response = self.query(self.get_delete_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).contains(
            "No permissions to perform delete."
        )
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_false()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_true()


class CreateSpaceTestCase(SpaceMutationBaseTestCase):
    def setUp(self) -> None:
        self._client.force_login(self.general_admin)

    def get_create_query(self):
        return """
        mutation createSpace($input: SpaceCreateMutationInput!) {
            createSpace(input: $input) {
                id
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
            Space.objects.filter(id=content["data"]["createSpace"]["id"]).exists()
        ).is_true()

    def test_no_name_fi_errors(self):
        data = {"name": "SpaceName"}
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

    def test_regular_user_cannot_create(self):
        self._client.force_login(self.regular_user)
        data = {"nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Space.objects.all().exists()).is_false()


class UpdateSpaceTestCase(SpaceMutationBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.space = SpaceFactory(name="Space1")

    def setUp(self) -> None:
        self._client.force_login(self.general_admin)

    def get_update_query(self):
        return """
        mutation updateSpace($input: SpaceUpdateMutationInput!) {
            updateSpace(input: $input) {
                id
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
            Space.objects.get(id=content["data"]["updateSpace"]["id"]).name_en
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
        self._client.force_login(self.regular_user)
        data = {"pk": self.space.pk, "nameFi": "Woohoo I created a space!"}
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.space.refresh_from_db()
        assert_that(self.space.name_fi).is_equal_to("Space1")
