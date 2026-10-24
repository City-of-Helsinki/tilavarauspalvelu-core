from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import PriceUnit
from utils.date_utils import local_date

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
)

from .helpers import reservation_unit_query, reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


FIELDS = "priceSummary { isFree lowestAmount priceUnit varies }"


# ── Price summary ──


def test_reservation_unit__query__price_summary__one_price(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal("12.50"),
        price_unit=PriceUnit.PER_HOUR,
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {
            "isFree": False,
            "lowestAmount": "12.50",
            "priceUnit": PriceUnit.PER_HOUR.value,
            "varies": False,
        },
    }


def test_reservation_unit__query__price_summary__options_with_different_prices(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        price_option=PriceOptionFactory.create(unit_group=unit_group),
        amount=Decimal(30),
        price_unit=PriceUnit.PER_HOUR,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        price_option=PriceOptionFactory.create(unit_group=unit_group),
        amount=Decimal(15),
        price_unit=PriceUnit.PER_HOUR,
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {
            "isFree": False,
            "lowestAmount": "15.00",
            "priceUnit": PriceUnit.PER_HOUR.value,
            "varies": True,
        },
    }


def test_reservation_unit__query__price_summary__inactive_option_not_included(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        price_option=PriceOptionFactory.create(unit_group=unit_group),
        amount=Decimal(30),
        price_unit=PriceUnit.PER_HOUR,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        price_option=PriceOptionFactory.create(unit_group=unit_group, is_active=False),
        amount=Decimal(15),
        price_unit=PriceUnit.PER_HOUR,
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {
            "isFree": False,
            "lowestAmount": "30.00",
            "priceUnit": PriceUnit.PER_HOUR.value,
            "varies": False,
        },
    }


def test_reservation_unit__query__price_summary__free(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    PriceComponentFactory.create_free(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        price_unit=PriceUnit.FIXED,
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {
            "isFree": True,
            "lowestAmount": "0.00",
            "priceUnit": PriceUnit.FIXED.value,
            "varies": False,
        },
    }


def test_reservation_unit__query__price_summary__future_price_change_not_included(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=20),
        valid_until=today - datetime.timedelta(days=5),
        amount=Decimal(5),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=5),
        valid_until=today + datetime.timedelta(days=5),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today + datetime.timedelta(days=5),
        amount=Decimal(10),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {
            "isFree": False,
            "lowestAmount": "20.00",
            "priceUnit": PriceUnit.PER_HOUR.value,
            "varies": False,
        },
    }


def test_reservation_unit__query__price_summary__future_pricing_group_not_included(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    active_group = PricingGroupFactory.create()
    future_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=active_group,
        begins=today - datetime.timedelta(days=10),
    )
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=future_group,
        begins=today + datetime.timedelta(days=10),
    )
    PriceComponentFactory.create(
        pricing_group=active_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=future_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal(10),
    )

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["priceSummary"]["lowestAmount"] == "20.00"


def test_reservation_unit__query__price_summary__no_pricing_group(graphql):
    reservation_unit = ReservationUnitFactory.create()

    query = reservation_unit_query(fields=FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceSummary": None}


def test_reservation_unit__query__price_summary__query_count_does_not_grow_with_list(graphql):
    today = local_date()
    for amount in (Decimal(10), Decimal(20), Decimal(30)):
        reservation_unit = ReservationUnitFactory.create()
        pricing_group = PricingGroupFactory.create()
        ReservationUnitPricingGroupFactory.create(
            reservation_unit=reservation_unit,
            pricing_group=pricing_group,
            begins=today - datetime.timedelta(days=10),
        )
        PriceComponentFactory.create(
            pricing_group=pricing_group,
            valid_from=today - datetime.timedelta(days=10),
            amount=amount,
        )

    query = reservation_units_query(fields=f"pk {FIELDS}")
    response = graphql(query)

    assert response.has_errors is False, response
    assert [response.node(index)["priceSummary"]["lowestAmount"] for index in range(3)] == ["10.00", "20.00", "30.00"]
    assert len(response.queries) == 2, response.query_log
