import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from spaces.models import Unit
from spaces.tests.factories import UnitFactory


class UnitQueryTestCaseBase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.unit = UnitFactory(
            name="Test unit",
            description="Test description",
            short_description="Short description",
            web_page="https://hel.fi",
            email="test@example.com",
            phone="+358 12 34567",
        )

        cls.unit_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )
        unit_role_choice = UnitRoleChoice.objects.get(code="admin")
        unit_role = UnitRole.objects.create(user=cls.unit_admin, role=unit_role_choice)
        unit_role.unit.add(cls.unit)
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


class UnitsUpdateTestCase(UnitQueryTestCaseBase):
    def test_admin_can_update_unit(self):
        self.client.force_login(self.unit_admin)
        desc = "Awesomeunit"
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.unit.pk, "descriptionFi": desc},
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Unit.objects.get(pk=self.unit.pk).description).is_equal_to(desc)

    def test_normal_user_cannot_update_unit(self):
        self.client.force_login(self.regular_joe)
        desc = "Awesomeunit"
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.unit.pk, "descriptionFi": desc},
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")[0]["message"]).contains(
            "No permission to mutate"
        )
        assert_that(Unit.objects.get(pk=self.unit.pk).description).is_equal_to(
            "Test description"
        )

    def test_getting_units(self):
        response = self.query(
            """
            query {
                units {
                    edges {
                        node {
                            nameFi
                            nameEn
                            nameSv
                            descriptionFi
                            descriptionEn
                            descriptionSv
                            shortDescriptionFi
                            shortDescriptionEn
                            shortDescriptionSv
                            webPage
                            email
                            phone
                            reservationUnits {
                                nameFi
                            }
                            spaces {
                                nameFi
                            }
                            location {
                                addressStreetFi
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_getting_units_sorted_by_name_asc(self):
        UnitFactory.create(name="Aaaaaa")
        UnitFactory.create(name="Bbbbbb")
        UnitFactory.create(name="Cccccc")
        response = self.query(
            """
            query {
                units(orderBy:"nameFi") {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)

    def test_getting_units_sorted_by_name_desc(self):
        UnitFactory.create(name="Aaaaaa")
        UnitFactory.create(name="Bbbbbb")
        UnitFactory.create(name="Cccccc")
        response = self.query(
            """
                query {
                    units(orderBy:"-nameFi") {
                        edges {
                            node {
                                nameFi
                            }
                        }
                    }
                }
                """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.assertMatchSnapshot(content)
