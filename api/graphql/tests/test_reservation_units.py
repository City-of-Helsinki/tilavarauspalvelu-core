import json

import snapshottest
from assertpy import assert_that
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)


class ReservationUnitTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        type = ReservationUnitTypeFactory(name="Test type")
        cls.reservation_unit = ReservationUnitFactory(
            name="Test name", reservation_unit_type=type
        )

        cls.api_client = APIClient()

    def test_getting_reservation_units(self):
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            name
                            description
                            spaces {
                              name
                            }
                            resources {
                              name
                            }
                            services {
                              name
                            }
                            requireIntroduction
                            purposes {
                              name
                            }
                            images {
                              imageUrl
                              mediumUrl
                              smallUrl
                            }
                            location {
                              longitude
                              latitude
                            }
                            maxPersons
                            reservationUnitType {
                              name
                            }
                            termsOfUse
                            equipment {
                              name
                            }
                            contactInformation
                          }
                        }
                    }
                }
            """
        )

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
