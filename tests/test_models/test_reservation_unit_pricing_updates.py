import datetime
from decimal import Decimal

import pytest

from reservation_units.enums import PricingStatus, PricingType
from reservation_units.models import ReservationUnitPricing
from reservation_units.pricing_updates import update_reservation_unit_pricings
from reservation_units.tasks import update_reservation_unit_pricings_tax_percentage
from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory
from tests.helpers import patch_method
from utils.sentry import SentryLogger

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


###################################################
# update_reservation_unit_pricings_tax_percentage #
###################################################


TAX_CHANGE_DATE = datetime.date(2024, 9, 1)
CURRENT_TAX = Decimal("24")
FUTURE_TAX = Decimal("25.5")


def test_reservation_unit__update_pricings__tax_percentage__no_future_pricing():
    active_pricing = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 1  # New pricing should be created for the change date

    future_pricing = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).first()
    assert future_pricing.tax_percentage.value == FUTURE_TAX
    assert active_pricing.tax_percentage.value == CURRENT_TAX  # Active pricing should not be changed


def test_reservation_unit__update_pricings__tax_percentage__future_pricing_before_change_date():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
        highest_price=Decimal("10"),
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 8, 31),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
        highest_price=Decimal("20"),
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 2  # New pricing should be created, since the future pricing is before change date

    future_pricing = ReservationUnitPricing.objects.filter(
        status=PricingStatus.PRICING_STATUS_FUTURE,
        begins=TAX_CHANGE_DATE,
    ).first()
    assert future_pricing.tax_percentage.value == FUTURE_TAX
    # Price should be the same as in the last pricing before the change date
    assert future_pricing.highest_price == pricing_2.highest_price
    assert future_pricing.highest_price_net < pricing_2.highest_price_net


@pytest.mark.parametrize(
    "latest_begins_date",
    [
        TAX_CHANGE_DATE,
        datetime.date(2024, 9, 21),  # After the change date
    ],
)
@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__future_pricing_after_change_date(latest_begins_date):
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        begins=latest_begins_date,
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 1  # No new pricings should be created, since a pricing after the change date exists

    sentry_message = SentryLogger.log_message.call_args.kwargs["details"]
    assert sentry_message.startswith(f"Task found the following unhandled future pricings: <{pricing_2.id}: ")


def test_reservation_unit__update_pricings__tax_percentage__free_future_pricing_on_change_date():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
    )
    ReservationUnitPricingFactory.create(
        begins=TAX_CHANGE_DATE,
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
        pricing_type=PricingType.FREE,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 1  # No new pricings should be created, since a pricing on the change date exists


def test_reservation_unit__update_pricings__tax_percentage__free_future_pricing_after_change_date():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
    )
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 9, 21),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
        pricing_type=PricingType.FREE,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 2  # New pricing should be created, since the FREE pricing is after the change date

    # A new pricing
    future_pricing = ReservationUnitPricing.objects.filter(
        status=PricingStatus.PRICING_STATUS_FUTURE,
        begins=TAX_CHANGE_DATE,
    ).first()
    assert future_pricing.tax_percentage.value == FUTURE_TAX
    assert future_pricing.highest_price == pricing_1.highest_price
    assert future_pricing.highest_price_net < pricing_1.highest_price_net


def test_reservation_unit__update_pricings__tax_percentage__different_tax_percentage_is_ignored():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit,
        tax_percentage__value=Decimal("10"),
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 0  # No new pricing should be created


def test_reservation_unit__update_pricings__tax_percentage__free_pricing_is_ignored():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit,
        tax_percentage__value=CURRENT_TAX,
        pricing_type=PricingType.FREE,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricing_count = ReservationUnitPricing.objects.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count()
    assert future_pricing_count == 0  # No new pricing should be created


def test_reservation_unit__update_pricings__tax_percentage__ignored_company_codes():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
        reservation_unit__payment_accounting__company_code="1234",
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        tax_percentage__value=CURRENT_TAX,
        reservation_unit__payment_accounting__company_code="5678",
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX), ["5678"])

    # Only one new pricing should be created for the change date
    assert pricing_1.reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count() == 1
    # Second reservation unit is ignored, as the company code is in the ignored list
    assert pricing_2.reservation_unit.pricings.filter(status=PricingStatus.PRICING_STATUS_FUTURE).count() == 0
