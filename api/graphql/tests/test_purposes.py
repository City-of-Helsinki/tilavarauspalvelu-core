import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservation_units.tests.factories import PurposeFactory


class PurposeTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.purpose = PurposeFactory(name="Test purpose")

        cls.api_client = APIClient()

    def test_updating_purpose(self):
        response = self.query(
            f"mutation {{\n"
            f'updatePurpose(input: {{pk: {self.purpose.id}, name: "Updated name"}}) {{\n'
            f"purpose {{\n"
            f"name\n"
            f"pk\n"
            f"}}\n"
            f"errors {{\n"
            f"messages\n"
            f"field\n"
            f"}}\n"
            f"}}\n"
            f"}}\n"
        )

        content = json.loads(response.content).get("data")

        assert_that(content.get("errors")).is_none()
        purpose_content = content.get("updatePurpose").get("purpose")
        assert_that(purpose_content.get("pk")).is_equal_to(self.purpose.id)
        content.get("updatePurpose").get("purpose").pop("pk")
        self.assertMatchSnapshot(content)

    def test_updading_should_error_when_not_found(self):
        response = self.query(
            f"mutation {{\n"
            f'updatePurpose(input: {{pk: {self.purpose.id + 3782}, name: "Fail name"}}) {{\n'
            f"purpose {{\n"
            f"id\n"
            f"name\n"
            f"}}\n"
            f"errors {{\n"
            f"messages\n"
            f"field\n"
            f"}}\n"
            f"}}\n"
            f"}}\n"
        )

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to(
            "No Purpose matches the given query."
        )

    def test_creating_purpose(self):
        response = self.query(
            "mutation {\n"
            'createPurpose(input: {name: "Created purpose"}) {\n'
            "purpose {\n"
            "name\n"
            "}\n"
            "errors {\n"
            "messages\n"
            "field\n"
            "}\n"
            "}\n"
            "}\n"
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
