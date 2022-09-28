import json

import snapshottest
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from reservation_units.tests.factories import ReservationUnitTypeFactory


class ReservationUnitTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.type = ReservationUnitTypeFactory(
            name_fi="first fi", name_en="en", name_sv="sv", rank="1"
        )

        ReservationUnitTypeFactory(
            name_fi="second fi", name_en="en", name_sv="sv", rank="2"
        )
        ReservationUnitTypeFactory(
            name_fi="third fi", name_en="en", name_sv="sv", rank="3"
        )
        ReservationUnitTypeFactory(
            name_fi="fourth fi", name_en="en", name_sv="sv", rank="4"
        )

    def test_getting_reservation_unit_types_with_default_sorting(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnitTypes {
                    edges {
                        node {
                            nameFi
                            nameEn
                            nameSv
                            rank
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_getting_reservation_unit_types_sorted_by_name(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnitTypes(orderBy: "nameFi") {
                    edges {
                        node {
                            nameFi
                            nameEn
                            nameSv
                            rank
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
