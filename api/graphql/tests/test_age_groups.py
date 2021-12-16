import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservations.models import AgeGroup


class AgeGroupsGraphQLTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.api_client = APIClient()

    def test_getting_age_groups(self):
        AgeGroup.objects.create(minimum=18, maximum=30)
        response = self.query(
            """
            query {
                ageGroups {
                    edges {
                        node {
                            minimum
                            maximum
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
