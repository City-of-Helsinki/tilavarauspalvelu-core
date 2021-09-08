import json

from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from applications.tests.factories import ApplicationRoundFactory
from permissions.models import GeneralRole, GeneralRoleChoice
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.models import Space
from spaces.tests.factories import SpaceFactory


class TestDeleteSpaceTestCase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        cls.general_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )

        GeneralRole.objects.create(
            user=cls.general_admin,
            role=GeneralRoleChoice.objects.get(code="admin"),
        )

    def setUp(self) -> None:
        self.space = SpaceFactory(name="Test space")

    def get_delete_query(self):
        return (
            f"mutation deleteSpace {{deleteSpace(input: {{pk: {self.space.pk} }}){{"
            f"deleted errors"
            f"}}"
            f"}}"
        )

    def test_space_deleted(self):
        self._client.force_login(self.general_admin)
        response = self.query(self.get_delete_query())

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("errors")).is_none()
        assert_that(content.get("data").get("deleteSpace").get("deleted")).is_true()

        assert_that(Space.objects.filter(pk=self.space.pk).exists()).is_false()

    def test_space_not_deleted_because_in_active_round(self):
        self._client.force_login(self.general_admin)

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
        regular_joe = get_user_model().objects.create(
            username="regjoe",
            first_name="joe",
            last_name="regular",
            email="joe.regularl@foo.com",
        )
        self._client.force_login(regular_joe)

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
