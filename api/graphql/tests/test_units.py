import json

from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from spaces.models import Unit
from spaces.tests.factories import UnitFactory


class UnitsUpdateTestCase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        cls.unit = UnitFactory()

        cls.unit_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )
        unit_role_choice = UnitRoleChoice.objects.get(code="admin")
        UnitRole.objects.create(
            user=cls.unit_admin, role=unit_role_choice, unit=cls.unit
        )
        UnitRolePermission.objects.create(
            role=unit_role_choice, permission="can_manage_units"
        )

        cls.regular_joe = get_user_model().objects.create(
            username="regjoe",
            first_name="joe",
            last_name="regular",
            email="joe.regularl@foo.com",
        )

    def get_update_query(self):
        return "mutation updateUnit($input: UnitUpdateMutationInput!) {updateUnit(input: $input){pk}}"

    def test_admin_can_update_unit(self):
        self._client.force_login(self.unit_admin)
        desc = "Awesomeunit"
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.unit.pk, "description": desc},
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Unit.objects.get(pk=self.unit.pk).description).is_equal_to(desc)

    def test_normal_user_cannot_update_unit(self):
        self._client.force_login(self.regular_joe)
        desc = "Awesomeunit"
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.unit.pk, "description": desc},
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")[0]["message"]).contains(
            "No permission to mutate"
        )
        assert_that(Unit.objects.get(pk=self.unit.pk).description).is_empty()
