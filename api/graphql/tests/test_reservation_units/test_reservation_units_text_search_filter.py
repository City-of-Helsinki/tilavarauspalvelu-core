import json

from assertpy import assert_that

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
)
from tests.factories import SpaceFactory


class ReservationUnitsFilterTextSearchTestCase(ReservationUnitQueryTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation_unit.description_fi = "Lorem ipsum fi"
        cls.reservation_unit.description_sv = "Lorem ipsum sv"
        cls.reservation_unit.description_en = "Lorem ipsum en"

        space = SpaceFactory(name_en="space name en")
        cls.reservation_unit.spaces.set([space])

        cls.reservation_unit.save()

        # Bit of a hack to wait some time to get the search indexes updated.
        cls.reservation_unit.index_search_document(index=cls.reservation_unit.search_indexes[0])

    def test_filtering_by_type_fi(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type fi"){
                    edges {
                        node {
                            nameFi
                            reservationUnitType {
                                nameFi
                            }
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Nonexisting type"){
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_type_en(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type en"){
                    edges {
                        node {
                            nameFi
                            reservationUnitType {
                                nameEn
                            }
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_type_sv(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type sv"){
                    edges {
                        node {
                            nameFi
                            reservationUnitType {
                                nameSv
                            }
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_reservation_unit_name_fi(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name fi"){
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Nonexisting name"){
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_reservation_unit_name_en(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name en"){
                    edges {
                        node {
                            nameEn
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_reservation_unit_name_sv(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name sv"){
                    edges {
                        node {
                            nameSv
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_reservation_unit_description_fi(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum fi"){
                    edges {
                        node {
                            nameFi
                            descriptionFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Dolor sit"){
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_reservation_unit_description_en(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum en"){
                    edges {
                        node {
                            nameFi
                            descriptionEn
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_reservation_unit_description_sv(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum sv"){
                    edges {
                        node {
                            nameFi
                            descriptionSv
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_space_name_fi(self):
        space = SpaceFactory(name="space name fi")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name fi"){
                    edges {
                        node {
                            nameFi
                            spaces{nameFi}
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"not a space name"){
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_space_name_en(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name en"){
                    edges {
                        node {
                            nameFi
                            spaces{nameEn}
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_space_name_sv(self):
        space = SpaceFactory(name_sv="space name sv")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name sv"){
                    edges {
                        node {
                            nameFi
                            spaces{nameSv}
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
