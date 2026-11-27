from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import PriceComponentKind, PriceUnit
from utils.date_utils import local_datetime

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    TaxLevelFactory,
    UnitGroupFactory,
)
from tests.test_graphql_api.test_reservation.helpers import reservations_query

from .helpers import reservation_unit_query, reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


FIELDS = """
    nextPriceChange {
        begins
        summary { isFree lowestAmount priceUnit varies canApplyForDiscount taxPercentage }
    }
"""


# ── Pricing group change ──


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__pricing_group_changes(graphql):
    reservation_unit = ReservationUnitFactory.create()
    active_group = PricingGroupFactory.create()
    future_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=active_group,
        begins=datetime.date(2026, 1, 1),
    )
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=future_group,
        begins=datetime.date(2026, 2, 1),
    )
    PriceComponentFactory.create(pricing_group=active_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(20))
    PriceComponentFactory.create(pricing_group=future_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(30))

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "nextPriceChange": {
            "begins": "2026-02-01",
            "summary": {
                "isFree": False,
                "lowestAmount": "30.00",
                "priceUnit": PriceUnit.PER_HOUR.value,
                "varies": False,
                "canApplyForDiscount": False,
                "taxPercentage": "25.50",
            },
        },
    }


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__first_pricing_group_in_future(graphql):
    reservation_unit = ReservationUnitFactory.create()
    future_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=future_group,
        begins=datetime.date(2026, 2, 1),
    )
    PriceComponentFactory.create(pricing_group=future_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(30))

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["nextPriceChange"]["begins"] == "2026-02-01"
    assert response.first_query_object["nextPriceChange"]["summary"]["lowestAmount"] == "30.00"


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__past_pricing_group_not_included(graphql):
    reservation_unit = ReservationUnitFactory.create()
    past_group = PricingGroupFactory.create()
    active_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=past_group,
        begins=datetime.date(2025, 1, 1),
    )
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=active_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(pricing_group=past_group, valid_from=datetime.date(2025, 1, 1), amount=Decimal(10))
    PriceComponentFactory.create(pricing_group=active_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(20))

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"nextPriceChange": None}


# ── Component change ──


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__component_changes(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 3, 1),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 3, 1),
        amount=Decimal(25),
        price_unit=PriceUnit.FIXED,
        can_apply_for_discount=True,
        tax_level=TaxLevelFactory.create(rates__percentage=Decimal(14)),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "nextPriceChange": {
            "begins": "2026-03-01",
            "summary": {
                "isFree": False,
                "lowestAmount": "25.00",
                "priceUnit": PriceUnit.FIXED.value,
                "varies": False,
                "canApplyForDiscount": True,
                "taxPercentage": "14.00",
            },
        },
    }


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__surcharge_begins(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        amount=Decimal(20),
        tax_level=TaxLevelFactory.create(rates__percentage=Decimal("25.5")),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        kind=PriceComponentKind.SURCHARGE,
        valid_from=datetime.date(2026, 3, 1),
        amount=Decimal(5),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "nextPriceChange": {
            "begins": "2026-03-01",
            "summary": {
                "isFree": False,
                "lowestAmount": "20.00",
                "priceUnit": PriceUnit.PER_HOUR.value,
                "varies": True,
                "canApplyForDiscount": False,
                "taxPercentage": "25.50",
            },
        },
    }


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__active_surcharge_is_no_change(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(20))
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        kind=PriceComponentKind.SURCHARGE,
        valid_from=datetime.date(2026, 1, 1),
        amount=Decimal(5),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"nextPriceChange": None}


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__only_tax_level_changes(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 3, 1),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 3, 1),
        amount=Decimal(20),
        tax_level=TaxLevelFactory.create(rates__percentage=Decimal(14)),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["nextPriceChange"]["begins"] == "2026-03-01"
    assert response.first_query_object["nextPriceChange"]["summary"]["lowestAmount"] == "20.00"
    assert response.first_query_object["nextPriceChange"]["summary"]["taxPercentage"] == "14.00"


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__becomes_free(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 3, 1),
        amount=Decimal(20),
    )
    PriceComponentFactory.create_free(pricing_group=pricing_group, valid_from=datetime.date(2026, 3, 1))

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["nextPriceChange"]["begins"] == "2026-03-01"
    assert response.first_query_object["nextPriceChange"]["summary"]["isFree"] is True


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__first_of_many_changes(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 3, 1),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 3, 1),
        valid_until=datetime.date(2026, 5, 1),
        amount=Decimal(25),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 5, 1), amount=Decimal(30))

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["nextPriceChange"]["begins"] == "2026-03-01"
    assert response.first_query_object["nextPriceChange"]["summary"]["lowestAmount"] == "25.00"


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__change_without_summary_change_skipped(graphql):
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    cheap_option = PriceOptionFactory.create(unit_group=unit_group)
    expensive_option = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        price_option=cheap_option,
        amount=Decimal(10),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 2, 1),
        price_option=expensive_option,
        amount=Decimal(30),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 2, 1),
        valid_until=datetime.date(2026, 3, 1),
        price_option=expensive_option,
        amount=Decimal(40),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 3, 1),
        price_option=expensive_option,
        amount=Decimal(10),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["nextPriceChange"]["begins"] == "2026-03-01"
    assert response.first_query_object["nextPriceChange"]["summary"]["varies"] is False


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__inactive_option_not_included(graphql):
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(20))
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 3, 1),
        price_option=PriceOptionFactory.create(unit_group=unit_group, is_active=False),
        amount=Decimal(5),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"nextPriceChange": None}


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__no_change(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1), amount=Decimal(20))

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"nextPriceChange": None}


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__no_pricing_group(graphql):
    reservation_unit = ReservationUnitFactory.create()

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"nextPriceChange": None}


# ── Reservation limit ──


def _create_reservation_unit_with_price_change_on_march_1(**kwargs):
    reservation_unit = ReservationUnitFactory.create(**kwargs)
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=datetime.date(2026, 1, 1),
        valid_until=datetime.date(2026, 3, 1),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 3, 1), amount=Decimal(30))
    return reservation_unit


@pytest.mark.parametrize(
    ("reservation_ends_at", "has_change"),
    [
        (local_datetime(2026, 3, 1, 0, 0), False),
        (local_datetime(2026, 3, 1, 0, 30), True),
    ],
)
@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__reservation_ends_at(graphql, reservation_ends_at, has_change):
    reservation_unit = _create_reservation_unit_with_price_change_on_march_1(reservation_ends_at=reservation_ends_at)

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert (response.first_query_object["nextPriceChange"] is not None) is has_change


@pytest.mark.parametrize(
    ("reservations_max_days_before", "has_change"),
    [
        # 2026-01-15 12:00 + 44 days is 2026-02-28 12:00, and + 45 days is 2026-03-01 12:00.
        (44, False),
        (45, True),
    ],
)
@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__reservations_max_days_before(
    graphql,
    reservations_max_days_before,
    has_change,
):
    reservation_unit = _create_reservation_unit_with_price_change_on_march_1(
        reservations_max_days_before=reservations_max_days_before,
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert (response.first_query_object["nextPriceChange"] is not None) is has_change


# ── Query count ──


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__query_count_does_not_grow_with_list(graphql):
    for _ in range(3):
        _create_reservation_unit_with_price_change_on_march_1()

    query = reservation_units_query(fields=f"pk {FIELDS}")
    response = graphql(query)

    assert response.has_errors is False, response
    assert [response.node(index)["nextPriceChange"]["begins"] for index in range(3)] == [
        "2026-03-01",
        "2026-03-01",
        "2026-03-01",
    ]
    assert len(response.queries) == 2, response.query_log


@freeze_time(local_datetime(2026, 1, 15, 12))
def test_reservation_unit__query__next_price_change__through_foreign_key(graphql):
    for _ in range(3):
        reservation_unit = _create_reservation_unit_with_price_change_on_march_1()
        ReservationFactory.create(reservation_unit=reservation_unit)

    graphql.login_with_superuser()
    query = reservations_query(fields=f"pk reservationUnit {{ {FIELDS} }}")
    response = graphql(query)

    assert response.has_errors is False, response
    assert [response.node(index)["reservationUnit"]["nextPriceChange"]["begins"] for index in range(3)] == [
        "2026-03-01",
        "2026-03-01",
        "2026-03-01",
    ]
