from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.services.pricing.coverage import CoverageError, check_pricing_group_coverage
from tilavarauspalvelu.typing import error_codes

from tests.factories import PriceComponentFactory, PriceOptionFactory, PricingGroupFactory, UnitGroupFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


JAN_1 = datetime.date(2026, 1, 1)
FEB_1 = datetime.date(2026, 2, 1)
MAR_1 = datetime.date(2026, 3, 1)
APR_1 = datetime.date(2026, 4, 1)


# ── No errors ──


def test_coverage__one_component_with_no_end():
    component = PriceComponentFactory.build(valid_from=JAN_1, valid_until=None)

    errors = check_pricing_group_coverage(components=[component], reservation_unit_begin_dates=[JAN_1])

    assert errors == []


def test_coverage__price_change_with_no_gap():
    first = PriceComponentFactory.build(valid_from=JAN_1, valid_until=FEB_1)
    second = PriceComponentFactory.build(valid_from=FEB_1, valid_until=None)

    errors = check_pricing_group_coverage(components=[first, second], reservation_unit_begin_dates=[JAN_1])

    assert errors == []


def test_coverage__no_components_and_no_reservation_units():
    errors = check_pricing_group_coverage(components=[], reservation_unit_begin_dates=[])

    assert errors == []


def test_coverage__options_with_their_own_components():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)

    components = [
        PriceComponentFactory.build(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1),
        PriceComponentFactory.build(pricing_group=pricing_group, price_option=juniors, valid_from=JAN_1),
    ]

    errors = check_pricing_group_coverage(components=components, reservation_unit_begin_dates=[])

    assert errors == []


def test_coverage__option_starts_later():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)

    components = [
        PriceComponentFactory.build(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1),
        PriceComponentFactory.build(pricing_group=pricing_group, price_option=juniors, valid_from=FEB_1),
    ]

    errors = check_pricing_group_coverage(components=components, reservation_unit_begin_dates=[])

    assert errors == []


def test_coverage__free_and_paid_components_on_the_same_date():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)

    components = [
        PriceComponentFactory.build(
            pricing_group=pricing_group,
            price_option=adults,
            valid_from=JAN_1,
            payment_type=PaymentType.ONLINE,
        ),
        PriceComponentFactory.build(
            pricing_group=pricing_group,
            price_option=juniors,
            valid_from=JAN_1,
            amount=Decimal(0),
            payment_type=None,
        ),
    ]

    errors = check_pricing_group_coverage(components=components, reservation_unit_begin_dates=[])

    assert errors == []


# ── Gaps ──


def test_coverage__gap_between_dates():
    first = PriceComponentFactory.build(valid_from=JAN_1, valid_until=FEB_1)
    second = PriceComponentFactory.build(valid_from=MAR_1, valid_until=None)

    errors = check_pricing_group_coverage(components=[first, second], reservation_unit_begin_dates=[])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_GAP,
            message="Pricing group has no price from 2026-02-01 until 2026-03-01.",
            components=[],
            begin=FEB_1,
            end=MAR_1,
        ),
    ]


def test_coverage__last_component_has_an_end():
    component = PriceComponentFactory.build(valid_from=JAN_1, valid_until=FEB_1)

    errors = check_pricing_group_coverage(components=[component], reservation_unit_begin_dates=[])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_GAP,
            message="Pricing group has no price from 2026-02-01 onward.",
            components=[],
            begin=FEB_1,
            end=None,
        ),
    ]


# ── Overlaps ──


def test_coverage__overlap_without_options():
    first = PriceComponentFactory.build(valid_from=JAN_1, valid_until=MAR_1)
    second = PriceComponentFactory.build(valid_from=FEB_1, valid_until=None)

    errors = check_pricing_group_coverage(components=[first, second], reservation_unit_begin_dates=[])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_OVERLAP,
            message="Pricing group has more than one price from 2026-02-01 until 2026-03-01.",
            components=[first, second],
            begin=FEB_1,
            end=MAR_1,
        ),
    ]


def test_coverage__overlap_for_one_option():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")

    first = PriceComponentFactory.build(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)
    second = PriceComponentFactory.build(pricing_group=pricing_group, price_option=adults, valid_from=FEB_1)

    errors = check_pricing_group_coverage(components=[first, second], reservation_unit_begin_dates=[])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_OVERLAP,
            message="Pricing group has more than one price for option 'Adults' from 2026-02-01 onward.",
            components=[first, second],
            begin=FEB_1,
            end=None,
        ),
    ]


def test_coverage__component_for_all_options_overlaps_an_option():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")

    for_adults = PriceComponentFactory.build(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)
    for_all = PriceComponentFactory.build(pricing_group=pricing_group, price_option=None, valid_from=JAN_1)

    errors = check_pricing_group_coverage(components=[for_adults, for_all], reservation_unit_begin_dates=[])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_COVERAGE_OVERLAP,
            message="Pricing group has more than one price for option 'Adults' from 2026-01-01 onward.",
            components=[for_adults, for_all],
            begin=JAN_1,
            end=None,
        ),
    ]


# ── Payment type ──


def test_coverage__paid_components_with_different_payment_types():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)

    online = PriceComponentFactory.build(
        pricing_group=pricing_group,
        price_option=adults,
        valid_from=JAN_1,
        payment_type=PaymentType.ONLINE,
    )
    on_site = PriceComponentFactory.build(
        pricing_group=pricing_group,
        price_option=juniors,
        valid_from=JAN_1,
        payment_type=PaymentType.ON_SITE,
    )

    errors = check_pricing_group_coverage(components=[online, on_site], reservation_unit_begin_dates=[])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_PAYMENT_TYPE_CONFLICT,
            message="All paid prices must have the same payment type from 2026-01-01 onward.",
            components=[online, on_site],
            begin=JAN_1,
            end=None,
        ),
    ]


# ── Reservation units ──


def test_coverage__reservation_unit_begins_before_components():
    component = PriceComponentFactory.build(valid_from=FEB_1, valid_until=None)

    errors = check_pricing_group_coverage(components=[component], reservation_unit_begin_dates=[APR_1, JAN_1])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_BEGINS_BEFORE_COMPONENTS,
            message="A reservation unit uses the pricing group from 2026-01-01, but its prices begin on 2026-02-01.",
            components=[],
            begin=JAN_1,
            end=FEB_1,
        ),
    ]


def test_coverage__reservation_unit_uses_a_group_with_no_components():
    errors = check_pricing_group_coverage(components=[], reservation_unit_begin_dates=[JAN_1])

    assert errors == [
        CoverageError(
            code=error_codes.PRICING_GROUP_BEGINS_BEFORE_COMPONENTS,
            message="Pricing group has no prices, but a reservation unit uses it.",
            components=[],
            begin=JAN_1,
            end=None,
        ),
    ]
