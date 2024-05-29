import datetime

import pytest

from reservation_units.enums import PricingStatus
from reservation_units.pricing_updates import update_reservation_unit_pricings
from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__update_pricings():
    reservation_unit_1 = ReservationUnitFactory.create(name="Unit that should be updated")
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit_1,
    )
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 9, 19),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=reservation_unit_1,
    )

    runit_2 = ReservationUnitFactory.create(name="Unit with future price with non-matching date")
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=runit_2,
    )
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 9, 20),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=runit_2,
    )

    runit_3 = ReservationUnitFactory.create(name="Unit without future price")
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=runit_3,
    )

    today = datetime.date(2022, 9, 19)
    num_updated = update_reservation_unit_pricings(today)

    assert num_updated == 1

    reservation_unit_1.refresh_from_db()
    runit_2.refresh_from_db()
    runit_3.refresh_from_db()

    active_pricing_1 = reservation_unit_1.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
    future_pricing_1 = reservation_unit_1.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    past_pricing_1 = reservation_unit_1.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
    assert active_pricing_1.begins == today
    assert future_pricing_1 is None
    assert past_pricing_1.begins == datetime.date(2022, 1, 1)

    active_pricing_2 = runit_2.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
    future_pricing_2 = runit_2.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    past_pricing_2 = runit_2.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
    assert active_pricing_2.begins == datetime.date(2022, 1, 1)
    assert future_pricing_2.begins == datetime.date(2022, 9, 20)
    assert past_pricing_2 is None

    active_pricing_3 = runit_3.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
    future_pricing_3 = runit_3.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    past_pricing_3 = runit_3.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
    assert active_pricing_3.begins == datetime.date(2022, 1, 1)
    assert future_pricing_3 is None
    assert past_pricing_3 is None
