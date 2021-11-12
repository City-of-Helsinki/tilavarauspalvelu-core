import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservations.tests.factories import ReservationPurposeFactory


class ReservationPurposeQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.purpose = ReservationPurposeFactory(
            name_fi="fi", name_sv="sv", name_en="en"
        )

    def test_getting_reservation_unit_purposes(self):
        response = self.query(
            """
            query {
                reservationPurposes {
                    edges {
                        node {
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
