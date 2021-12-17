import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservations.models import ReservationMetadataField, ReservationMetadataSet


class MetadataSetsGraphQLTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.api_client = APIClient()

    def test_getting_metadata_sets(self):
        supported_fields = ReservationMetadataField.objects.filter(
            field_name__in=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_phone",
            ]
        )
        required_fields = ReservationMetadataField.objects.filter(
            field_name__in=[
                "reservee_first_name",
                "reservee_last_name",
            ]
        )
        metadata_set = ReservationMetadataSet.objects.create(name="Test form")
        metadata_set.supported_fields.set(supported_fields)
        metadata_set.required_fields.set(required_fields)
        response = self.query(
            """
            query {
                metadataSets {
                    edges {
                        node {
                            name
                            supportedFields
                            requiredFields
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
