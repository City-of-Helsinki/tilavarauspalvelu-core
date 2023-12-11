import datetime
import json

from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservation_units.base import ReservationUnitQueryTestCaseBase
from reservation_units.models import PricingType
from tests.factories import PaymentProductFactory, ReservationUnitFactory


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
            payment_product=PaymentProductFactory.create(),
            pricings__pricing_type=PricingType.PAID,
        )
        cls.reservable_reservation_unit = ReservationUnitFactory(
            name="I'm also reservable since I'm free!",
            pricings__pricing_type=PricingType.FREE,
        )
        cls.scheduled_period = ReservationUnitFactory(
            name="I am scheduled period",
            reservation_begins=(now + datetime.timedelta(days=1)),
            reservation_ends=(now + datetime.timedelta(days=2)),
        )
        cls.scheduled_closing = ReservationUnitFactory(
            name="I am scheduled closing",
            pricings__pricing_type=PricingType.FREE,
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
        assert content.get("errors") is None
        assert not self.content_is_empty(content)
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
        assert content.get("errors") is None
        assert not self.content_is_empty(content)
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
        assert content.get("errors") is None
        assert not self.content_is_empty(content)
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
        assert content.get("errors") is None
        assert not self.content_is_empty(content)
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
        assert content.get("errors") is None
        assert not self.content_is_empty(content)
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
        assert content.get("errors") is None
        assert not self.content_is_empty(content)
        self.assertMatchSnapshot(content)
