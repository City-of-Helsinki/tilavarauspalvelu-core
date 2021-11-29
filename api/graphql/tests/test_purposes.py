import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.models import Purpose
from reservation_units.tests.factories import PurposeFactory


class PurposeTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.purpose = PurposeFactory(name="Test purpose")

    def setUp(self) -> None:
        super().setUp()
        self.client.force_login(self.general_admin)

    def get_create_query(self):
        return """
            mutation createPurpose($input: PurposeCreateMutationInput!){
                createPurpose(input: $input) {
                    purpose {
                        nameFi
                    }
                    errors {
                        messages
                        field
                    }
                }
            }"""

    def get_update_query(self):
        return """
            mutation updatePurpose($input: PurposeUpdateMutationInput!){
                updatePurpose(input: $input) {
                    purpose {
                        nameFi
                        pk
                    }
                    errors {
                        messages
                        field
                    }
                }
            }
        """

    def test_updating_purpose(self):
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.purpose.id, "nameFi": "Updated name"},
        )

        content = json.loads(response.content).get("data")

        assert_that(content.get("errors")).is_none()
        purpose_content = content.get("updatePurpose").get("purpose")
        assert_that(purpose_content.get("pk")).is_equal_to(self.purpose.id)
        content.get("updatePurpose").get("purpose").pop("pk")
        self.assertMatchSnapshot(content)

    def test_updating_should_error_when_not_found(self):
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.purpose.id + 3782, "nameFi": "Fail name"},
        )

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to(
            "No Purpose matches the given query."
        )

    def test_creating_purpose(self):
        response = self.query(
            self.get_create_query(), input_data={"nameFi": "Created purpose"}
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_normal_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(),
            input_data={"nameFi": "Created purpose"},
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Purpose.objects.exclude(id=self.purpose.id).exists()).is_false()

    def test_normal_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.purpose.id, "nameFi": "Updated name"},
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.purpose.refresh_from_db()
        assert_that(self.purpose.name).is_equal_to("Test purpose")


class PurposeQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.purpose = PurposeFactory(name_fi="fi", name_en="en", name_sv="sv")

    def test_getting_purposes(self):
        response = self.query(
            """
            query {
            purposes{
                edges{
                  node{
                    nameFi
                    nameEn
                    nameSv
                  }
                }
              }
            }
            """
        )
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
