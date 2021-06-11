import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservation_units.tests.factories import ReservationUnitFactory


class ReservationUnitTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reservation_unit = ReservationUnitFactory(name="Test name")

        cls.api_client = APIClient()

    def test_getting_reservation_units(self):
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
            """
        )

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
