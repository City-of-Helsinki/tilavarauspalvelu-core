from datetime import date

from django.test import TestCase

from reservation_units.enums import PricingStatus
from reservation_units.pricing_updates import update_reservation_unit_pricings
from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory


class PricingUpdatesTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.runit_1 = ReservationUnitFactory(name="Unit that should be updated")
        ReservationUnitPricingFactory(
            begins=date(2022, 1, 1),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=cls.runit_1,
        )
        ReservationUnitPricingFactory(
            begins=date(2022, 9, 19),
            status=PricingStatus.PRICING_STATUS_FUTURE,
            reservation_unit=cls.runit_1,
        )

        cls.runit_2 = ReservationUnitFactory(name="Unit with future price with non-matching date")
        ReservationUnitPricingFactory(
            begins=date(2022, 1, 1),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=cls.runit_2,
        )
        ReservationUnitPricingFactory(
            begins=date(2022, 9, 20),
            status=PricingStatus.PRICING_STATUS_FUTURE,
            reservation_unit=cls.runit_2,
        )

        cls.runit_3 = ReservationUnitFactory(name="Unit without future price")
        ReservationUnitPricingFactory(
            begins=date(2022, 1, 1),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=cls.runit_3,
        )

    def test_update_reservation_unit_pricings(self):
        today = date(2022, 9, 19)
        num_updated = update_reservation_unit_pricings(today)

        assert num_updated == 1

        self.runit_1.refresh_from_db()
        self.runit_2.refresh_from_db()
        self.runit_3.refresh_from_db()

        active_pricing_1 = self.runit_1.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
        future_pricing_1 = self.runit_1.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
        past_pricing_1 = self.runit_1.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
        assert active_pricing_1.begins == today
        assert future_pricing_1 is None
        assert past_pricing_1.begins == date(2022, 1, 1)

        active_pricing_2 = self.runit_2.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
        future_pricing_2 = self.runit_2.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
        past_pricing_2 = self.runit_2.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
        assert active_pricing_2.begins == date(2022, 1, 1)
        assert future_pricing_2.begins == date(2022, 9, 20)
        assert past_pricing_2 is None

        active_pricing_3 = self.runit_3.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
        future_pricing_3 = self.runit_3.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
        past_pricing_3 = self.runit_3.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
        assert active_pricing_3.begins == date(2022, 1, 1)
        assert future_pricing_3 is None
        assert past_pricing_3 is None
