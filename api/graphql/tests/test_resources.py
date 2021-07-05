import json
from datetime import timedelta

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from resources.tests.factories import ResourceFactory
from spaces.tests.factories import SpaceFactory


class ResourceGraphQLTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        space = SpaceFactory(name="Test space")
        cls.resource = ResourceFactory(name="Test resource", space=space)

        cls.api_client = APIClient()

    def test_getting_resources_with_null_buffer_times(self):
        response = self.query(
            """
            query {
              resources {
                edges {
                  node {
                    name
                    space {
                      name
                    }
                    building {
                      name
                    }
                    locationType
                    bufferTimeBefore
                    bufferTimeAfter
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

    def test_should_be_able_to_find_by_pk_with_buffer_times(self):
        self.resource.buffer_time_before = timedelta(hours=1)
        self.resource.buffer_time_after = timedelta(hours=2)
        self.resource.save()
        query = (
            f"{{\n"
            f"resourceByPk(pk: {self.resource.id}) {{\n"
            f"id name pk bufferTimeBefore bufferTimeAfter\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        resource = content.get("data").get("resourceByPk")

        assert_that(resource.get("pk")).is_equal_to(self.resource.id)

        assert_that(resource.get("id")).is_not_equal_to(self.resource.id)

        content.get("data").get("resourceByPk").pop("pk")
        content.get("data").get("resourceByPk").pop("id")
        self.assertMatchSnapshot(content)

    def test_should_error_when_not_found_by_pk(self):
        query = (
            f"{{\n"
            f"resourceByPk(pk: {self.resource.id + 657}) {{\n"
            f"id name pk\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to(
            "No Resource matches the given query."
        )
