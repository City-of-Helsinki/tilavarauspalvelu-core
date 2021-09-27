import json

import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from freezegun import freeze_time
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from reservation_units.tests.factories import ReservationUnitFactory


@freeze_time("2021-09-24")
class ReservationTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create()
        cls.reservation_unit = ReservationUnitFactory()

        cls.api_client = APIClient()

    def test_creating_reservation(self):
        self.maxDiff = None
        response = self.query(
            f"""
            mutation {{
              createReservation(input: {{
                state: "created"
                user: {self.user.pk}
                priority: "100"
                begin: "2020-01-01T00:00:00Z"
                end: "2020-01-01T01:00:00Z"
                reservationUnit: {self.reservation_unit.pk}
              }}) {{
                reservation {{
                  id
                  priority
                  calendarUrl
                }}
                errors {{
                  field
                  messages
                }}
              }}
            }}
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
