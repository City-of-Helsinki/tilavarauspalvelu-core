import datetime

from django.test import TestCase

from reservation_units.enums import ReservationState
from reservation_units.models import PricingType, ReservationUnit
from reservation_units.utils.reservation_unit_reservation_state_helper import (
    ReservationUnitReservationStateHelper as Helper,
)
from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory


class ReservationUnitReservationStateHelperTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation_unit: ReservationUnit = ReservationUnitFactory()
        cls.now = datetime.datetime.now(tz=datetime.UTC)

    def test_get_state_with_scheduled_reservation(self):
        self.reservation_unit.reservation_begins = self.now + datetime.timedelta(days=1)
        self.reservation_unit.reservation_ends = None

        assert Helper.get_state(self.reservation_unit) == ReservationState.SCHEDULED_RESERVATION

    def test_get_state_with_scheduled_period(self):
        self.reservation_unit.reservation_ends = self.now + datetime.timedelta(days=2)
        self.reservation_unit.reservation_begins = self.now + datetime.timedelta(days=1)

        assert Helper.get_state(self.reservation_unit) == ReservationState.SCHEDULED_PERIOD

    def test_get_state_with_is_reservable(self):
        self.reservation_unit.reservation_ends = None
        self.reservation_unit.reservation_begins = self.now - datetime.timedelta(days=1)
        ReservationUnitPricingFactory.create(reservation_unit=self.reservation_unit, pricing_type=PricingType.FREE)

        assert Helper.get_state(self.reservation_unit) == ReservationState.RESERVABLE

    def test_get_state_with_is_scheduled_closing(self):
        self.reservation_unit.reservation_ends = self.now + datetime.timedelta(days=1)
        self.reservation_unit.reservation_begins = self.now - datetime.timedelta(days=1)
        ReservationUnitPricingFactory.create(reservation_unit=self.reservation_unit, pricing_type=PricingType.FREE)

        assert Helper.get_state(self.reservation_unit) == ReservationState.SCHEDULED_CLOSING

    def test_get_state_with_reservation_closed_begins_is_in_past(self):
        self.reservation_unit.reservation_ends = self.now - datetime.timedelta(days=1)
        self.reservation_unit.reservation_begins = self.now - datetime.timedelta(days=2)

        assert Helper.get_state(self.reservation_unit) == ReservationState.RESERVATION_CLOSED

    def test_get_state_with_reservation_closed_begins_is_none(self):
        self.reservation_unit.reservation_ends = self.now - datetime.timedelta(days=1)
        self.reservation_unit.reservation_begins = None

        assert Helper.get_state(self.reservation_unit) == ReservationState.RESERVATION_CLOSED

    def test_state_is_closed_when_reservation_begin_and_end_in_past_and_same_value(
        self,
    ):
        self.reservation_unit.reservation_begins = self.now - datetime.timedelta(days=1)
        self.reservation_unit.reservation_ends = self.reservation_unit.reservation_begins

        assert Helper.get_state(self.reservation_unit) == ReservationState.RESERVATION_CLOSED
