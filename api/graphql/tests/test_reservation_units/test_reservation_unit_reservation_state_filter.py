import datetime
import json

from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
)
from tests.factories import ReservationUnitFactory


class ReservationUnitsFilterReservationStateTestCase(ReservationUnitQueryTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        now = datetime.datetime.now(tz=get_default_timezone())

        cls.scheduled_reservation_reservation_unit = ReservationUnitFactory(
            name="I am scheduled for reservation!",
            reservation_begins=(now + datetime.timedelta(hours=1)),
        )
        cls.reservable_reservation_unit = ReservationUnitFactory(
            name="Yey! I'm reservable!",
        )
        cls.scheduled_period = ReservationUnitFactory(
            name="I am scheduled period",
            reservation_begins=(now + datetime.timedelta(days=1)),
            reservation_ends=(now + datetime.timedelta(days=2)),
        )
        cls.scheduled_closing = ReservationUnitFactory(
            name="I am scheduled closing",
            reservation_begins=(now - datetime.timedelta(days=1)),
            reservation_ends=(now + datetime.timedelta(days=1)),
        )
        cls.reservation_closed = ReservationUnitFactory(
            name="My reservations are closed",
            reservation_begins=(now - datetime.timedelta(days=2)),
            reservation_ends=(now - datetime.timedelta(days=1)),
        )

    def test_filtering_by_scheduled_reservation(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationState:"SCHEDULED_RESERVATION"){
                    edges {
                        node {
                            nameFi
                            reservationState
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

    def test_filtering_by_reservable(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationState:"RESERVABLE"){
                    edges {
                        node {
                            nameFi
                            reservationState
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

    def test_filtering_by_mixed(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationState:["RESERVABLE", "SCHEDULED_RESERVATION"]){
                    edges {
                        node {
                            nameFi
                            reservationState
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

    def test_filtering_by_scheduled_period(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationState:"SCHEDULED_PERIOD"){
                    edges {
                        node {
                            nameFi
                            reservationState
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

    def test_filtering_by_scheduled_closing(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationState:"SCHEDULED_CLOSING"){
                    edges {
                        node {
                            nameFi
                            reservationState
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

    def test_filtering_by_reservation_closed(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationState:"RESERVATION_CLOSED"){
                    edges {
                        node {
                            nameFi
                            reservationState
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
