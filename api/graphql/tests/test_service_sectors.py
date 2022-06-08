import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from spaces.models import ServiceSector


class ServiceSectorsGraphQLTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.api_client = APIClient()

    def test_getting_service_sectors(self):
        ServiceSector.objects.create(name="Yksityinen")
        ServiceSector.objects.create(name="Kulttuuri ja vapaa-aika")
        response = self.query(
            """
            query {
                serviceSectors {
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
