import datetime

import pytest

from reservation_units.enums import PricingStatus
from reservation_units.pricing_updates import update_reservation_unit_pricings
from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


####################################
# update_reservation_unit_pricings #
####################################


def test_reservation_unit__update_pricings__updated():
    reservation_unit = ReservationUnitFactory.create(name="Unit that should be updated")
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit,
    )
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 9, 19),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=reservation_unit,
    )

    today = datetime.date(2022, 9, 19)
    num_updated = update_reservation_unit_pricings(today)

    assert num_updated == 1

    active_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
    future_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    past_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
    assert active_pricing.begins == today
    assert future_pricing is None
    assert past_pricing.begins == datetime.date(2022, 1, 1)


def test_reservation_unit__update_pricings__not_update__non_matching_date():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit,
    )
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 9, 20),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=reservation_unit,
    )

    today = datetime.date(2022, 9, 19)
    num_updated = update_reservation_unit_pricings(today)
    assert num_updated == 0

    active_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
    future_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    past_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
    assert active_pricing.begins == datetime.date(2022, 1, 1)
    assert future_pricing.begins == datetime.date(2022, 9, 20)
    assert past_pricing is None


def test_reservation_unit__update_pricings__not_update__no_future_pricing():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2022, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit,
    )

    today = datetime.date(2022, 9, 19)
    num_updated = update_reservation_unit_pricings(today)
    assert num_updated == 0

    active_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()
    future_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    past_pricing = reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_PAST).first()
    assert active_pricing.begins == datetime.date(2022, 1, 1)
    assert future_pricing is None
    assert past_pricing is None
