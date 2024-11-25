from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.models import ReservationUnitPricing
from tilavarauspalvelu.tasks import update_reservation_unit_pricings_tax_percentage
from utils.sentry import SentryLogger

from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


TAX_CHANGE_DATE = datetime.date(2024, 9, 1)
CURRENT_TAX = Decimal(24)
FUTURE_TAX = Decimal("25.5")


@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__no_future_pricing():
    active_pricing = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    future_pricings = ReservationUnitPricing.objects.filter(begins=TAX_CHANGE_DATE)
    assert future_pricings.count() == 1  # New pricing should be created for the change date

    assert future_pricings.first().tax_percentage.value == FUTURE_TAX
    assert active_pricing.tax_percentage.value == CURRENT_TAX  # Active pricing should not be changed

    assert SentryLogger.log_message.call_count == 1


@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__future_pricing_before_change_date():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        tax_percentage__value=CURRENT_TAX,
        highest_price=Decimal(10),
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 8, 31),
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
        highest_price=Decimal(20),
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    # New pricing should be created, since the future pricing is before change date
    assert ReservationUnitPricing.objects.count() == 3

    future_pricing = ReservationUnitPricing.objects.filter(begins=TAX_CHANGE_DATE).first()
    assert future_pricing.tax_percentage.value == FUTURE_TAX
    assert future_pricing.highest_price == pricing_2.highest_price  # Price is kept the same
    assert future_pricing.highest_price_net < pricing_2.highest_price_net  # Net price is less due to higher VAT

    assert SentryLogger.log_message.call_count == 1


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
        tax_percentage__value=CURRENT_TAX,
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        begins=latest_begins_date,
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    # No new pricings should be created, since a pricing after the change date exists
    assert ReservationUnitPricing.objects.count() == 2

    sentry_message = SentryLogger.log_message.call_args.kwargs["details"]
    assert sentry_message.startswith(f"Task found the following unhandled future pricings: <{pricing_2.id}: ")


@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__free_future_pricing_on_change_date():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        tax_percentage__value=CURRENT_TAX,
    )
    ReservationUnitPricingFactory.create_free(
        begins=TAX_CHANGE_DATE,
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    # No new pricings should be created, since a pricing on the change date exists
    assert ReservationUnitPricing.objects.count() == 2


@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__free_future_pricing_after_change_date():
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        tax_percentage__value=CURRENT_TAX,
    )
    ReservationUnitPricingFactory.create_free(
        begins=datetime.date(2024, 9, 21),
        reservation_unit=pricing_1.reservation_unit,
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    # New pricing should be created, since the FREE pricing is after the change date
    assert ReservationUnitPricing.objects.count() == 3

    # A new pricing
    future_pricing = ReservationUnitPricing.objects.filter(begins=TAX_CHANGE_DATE).first()
    assert future_pricing.tax_percentage.value == FUTURE_TAX
    assert future_pricing.highest_price == pricing_1.highest_price
    assert future_pricing.highest_price_net < pricing_1.highest_price_net

    assert SentryLogger.log_message.call_count == 1


@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__different_tax_percentage_is_ignored():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        reservation_unit=reservation_unit,
        tax_percentage__value=Decimal(10),  # Tax percentage is different
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    # No new pricing should be created
    assert ReservationUnitPricing.objects.count() == 1

    assert SentryLogger.log_message.call_count == 1


@patch_method(SentryLogger.log_message)
def test_reservation_unit__update_pricings__tax_percentage__free_pricing_is_ignored():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create_free(
        begins=datetime.date(2024, 1, 1),
        reservation_unit=reservation_unit,
        tax_percentage__value=CURRENT_TAX,
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX))

    # No new pricing should be created
    assert ReservationUnitPricing.objects.count() == 1

    assert SentryLogger.log_message.call_count == 1


@patch_method(SentryLogger.log_message)
@pytest.mark.parametrize(
    "company_code_path",
    [
        "reservation_unit__payment_accounting__company_code",
        "reservation_unit__unit__payment_accounting__company_code",
    ],
)
def test_reservation_unit__update_pricings__tax_percentage__ignored_company_codes(company_code_path):
    pricing_1 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        tax_percentage__value=CURRENT_TAX,
        **{company_code_path: "1234"},
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        begins=datetime.date(2024, 1, 1),
        tax_percentage__value=CURRENT_TAX,
        **{company_code_path: "5678"},
    )

    update_reservation_unit_pricings_tax_percentage(str(TAX_CHANGE_DATE), str(CURRENT_TAX), str(FUTURE_TAX), ["5678"])

    # One new pricing should be created for the change date
    assert pricing_1.reservation_unit.pricings.count() == 2

    # Second reservation unit is ignored, as the company code is in the ignored list
    assert pricing_2.reservation_unit.pricings.count() == 1

    assert SentryLogger.log_message.call_count == 1
