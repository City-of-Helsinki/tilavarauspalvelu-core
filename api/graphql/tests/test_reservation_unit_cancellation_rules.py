import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from tests.factories import ReservationUnitCancellationRuleFactory


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
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert "pk" in content["data"]["reservationUnitCancellationRules"]["edges"][0]["node"]
        del content["data"]["reservationUnitCancellationRules"]["edges"][0]["node"]["pk"]  # Ignore ID to allow db reuse
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
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert_that(content.get("data").get("reservationUnitCancellationRules").get("edges")).is_empty()
