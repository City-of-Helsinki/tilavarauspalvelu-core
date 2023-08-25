import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.tests.factories import ReservationUnitCancellationRuleFactory


class ReservationUnitCancellationRulesQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.rule = ReservationUnitCancellationRuleFactory(name_fi="fi", name_sv="sv", name_en="en")

    def test_getting_reservation_unit_cancellation_rules_for_logged_in_user(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnitCancellationRules {
                    edges {
                        node {
                            pk
                            nameFi
                            nameSv
                            nameEn
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

    def test_getting_reservation_unit_cancellation_rules_for_not_logged_in_user(self):
        response = self.query(
            """
            query {
                reservationUnitCancellationRules {
                    edges {
                        node {
                            pk
                            nameFi
                            nameSv
                            nameEn
                        }
                    }
                }
            }
            """
        )
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("reservationUnitCancellationRules").get("edges")).is_empty()
