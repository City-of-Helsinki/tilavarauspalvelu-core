import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.tests.factories import ReservationUnitTypeFactory


class ReservationUnitTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.type = ReservationUnitTypeFactory(name_fi="fi", name_en="en", name_sv="sv")

    def test_getting_reservation_unit_types(self):
        self.maxDiff = None
        self._client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnitTypes {
                    edges {
                        node {
                            pk
                            nameFi
                            nameEn
                            nameSv
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
