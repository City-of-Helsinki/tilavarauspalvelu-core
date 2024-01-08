import json

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
)
from api.graphql.tests.test_reservation_units.conftest import reservation_units_query
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
            reservation_units_query(
                textSearch="Test type fi",
                fields="nameFi reservationUnitType{nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["reservationUnitType"]["nameFi"] == "test type fi"

        response = self.query(
            reservation_units_query(
                textSearch="Nonexisting type",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert self.content_is_empty(content)

    def test_filtering_by_type_en(self):
        response = self.query(
            reservation_units_query(
                textSearch="Test type en",
                fields="nameFi reservationUnitType{nameEn}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["reservationUnitType"]["nameEn"] == "test type en"

    def test_filtering_by_type_sv(self):
        response = self.query(
            reservation_units_query(
                textSearch="Test type sv",
                fields="nameFi reservationUnitType{nameSv}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["reservationUnitType"]["nameSv"] == "test type sv"

    def test_filtering_by_reservation_unit_name_fi(self):
        response = self.query(
            reservation_units_query(
                textSearch="Test name fi",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"

        response = self.query(
            reservation_units_query(
                textSearch="Nonexisting name",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert self.content_is_empty(content)

    def test_filtering_by_reservation_unit_name_en(self):
        response = self.query(
            reservation_units_query(
                textSearch="Test name en",
                fields="nameEn",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameEn"] == "test name en"

    def test_filtering_by_reservation_unit_name_sv(self):
        response = self.query(
            reservation_units_query(
                textSearch="Test name sv",
                fields="nameSv",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameSv"] == "test name sv"

    def test_filtering_by_reservation_unit_description_fi(self):
        response = self.query(
            reservation_units_query(
                textSearch="Lorem ipsum fi",
                fields="nameFi descriptionFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["descriptionFi"] == "Lorem ipsum fi"

        response = self.query(
            reservation_units_query(
                textSearch="Dolor sit",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert self.content_is_empty(content)

    def test_filtering_by_reservation_unit_description_en(self):
        response = self.query(
            reservation_units_query(
                textSearch="Lorem ipsum en",
                fields="nameFi descriptionEn",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["descriptionEn"] == "Lorem ipsum en"

    def test_filtering_by_reservation_unit_description_sv(self):
        response = self.query(
            reservation_units_query(
                textSearch="Lorem ipsum sv",
                fields="nameFi descriptionSv",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["descriptionSv"] == "Lorem ipsum sv"

    def test_filtering_by_space_name_fi(self):
        space = SpaceFactory(name="space name fi")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            reservation_units_query(
                textSearch="space name fi",
                fields="nameFi spaces{nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["spaces"][0]["nameFi"] == "space name fi"

        response = self.query(
            reservation_units_query(
                textSearch="not a space name",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert self.content_is_empty(content)

    def test_filtering_by_space_name_en(self):
        response = self.query(
            reservation_units_query(
                textSearch="space name en",
                fields="nameFi spaces{nameEn}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["spaces"][0]["nameEn"] == "space name en"

    def test_filtering_by_space_name_sv(self):
        space = SpaceFactory(name_sv="space name sv")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            reservation_units_query(
                textSearch="space name sv",
                fields="nameFi spaces{nameSv}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert not self.content_is_empty(content)

        reservation_unit = content["data"]["reservationUnits"]["edges"][0]["node"]
        assert reservation_unit["nameFi"] == "test name fi"
        assert reservation_unit["spaces"][0]["nameSv"] == "space name sv"
