import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from applications.models import City


class CitiesGraphQLTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.api_client = APIClient()

    def test_getting_cities(self):
        City.objects.create(name="Helsinki")
        response = self.query(
            """
            query {
                cities {
                    edges {
                        node {
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
