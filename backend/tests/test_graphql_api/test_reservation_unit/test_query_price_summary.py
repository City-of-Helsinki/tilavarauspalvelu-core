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
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    TaxLevelFactory,
    TaxLevelRateFactory,
    UnitGroupFactory,
)
from tests.test_graphql_api.test_reservation.helpers import reservations_query

from .helpers import reservation_unit_query, reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


FIELDS = "priceSummary { isFree lowestAmount priceUnit varies canApplyForDiscount }"
TAX_FIELDS = "priceSummary { lowestAmount taxPercentage }"
MATERIAL_PRICE_FIELDS = (
    "priceSummary { isFree materialPriceDescriptionFi materialPriceDescriptionEn materialPriceDescriptionSv }"
)


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
            "canApplyForDiscount": False,
        },
    }


def test_reservation_unit__query__price_summary__can_apply_for_discount(graphql):
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
        can_apply_for_discount=True,
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
            "canApplyForDiscount": True,
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
            "canApplyForDiscount": False,
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
            "canApplyForDiscount": False,
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
            "canApplyForDiscount": False,
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
            "canApplyForDiscount": False,
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


def test_reservation_unit__query__price_summary__on_date__future_price_change(graphql):
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
        valid_until=today + datetime.timedelta(days=5),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today + datetime.timedelta(days=5),
        amount=Decimal(10),
        material_price_description_fi="Materiaalit",
    )
    on_date = today + datetime.timedelta(days=5)

    fields = f'priceSummary(onDate: "{on_date.isoformat()}") {{ lowestAmount materialPriceDescriptionFi }}'
    query = reservation_unit_query(fields=fields, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {"lowestAmount": "10.00", "materialPriceDescriptionFi": "Materiaalit"},
    }


def test_reservation_unit__query__price_summary__on_date__day_before_price_change(graphql):
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
        valid_until=today + datetime.timedelta(days=5),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today + datetime.timedelta(days=5),
        amount=Decimal(10),
    )
    on_date = today + datetime.timedelta(days=4)

    fields = f'priceSummary(onDate: "{on_date.isoformat()}") {{ lowestAmount }}'
    query = reservation_unit_query(fields=fields, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceSummary": {"lowestAmount": "20.00"}}


def test_reservation_unit__query__price_summary__on_date__future_pricing_group(graphql):
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
    on_date = today + datetime.timedelta(days=10)

    fields = f'priceSummary(onDate: "{on_date.isoformat()}") {{ lowestAmount }}'
    query = reservation_unit_query(fields=fields, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceSummary": {"lowestAmount": "10.00"}}


def test_reservation_unit__query__price_summary__on_date__aliases_with_different_dates(graphql):
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
        valid_until=today + datetime.timedelta(days=5),
        amount=Decimal(20),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today + datetime.timedelta(days=5),
        amount=Decimal(10),
    )
    on_date = today + datetime.timedelta(days=5)

    fields = (
        f"priceToday: priceSummary {{ lowestAmount }} "
        f'priceLater: priceSummary(onDate: "{on_date.isoformat()}") {{ lowestAmount }}'
    )
    query = reservation_unit_query(fields=fields, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceToday": {"lowestAmount": "20.00"},
        "priceLater": {"lowestAmount": "10.00"},
    }


def test_reservation_unit__query__price_summary__on_date__query_count_does_not_grow_with_list(graphql):
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
    on_date = today + datetime.timedelta(days=5)

    query = reservation_units_query(fields=f'pk priceSummary(onDate: "{on_date.isoformat()}") {{ lowestAmount }}')
    response = graphql(query)

    assert response.has_errors is False, response
    assert [response.node(index)["priceSummary"]["lowestAmount"] for index in range(3)] == ["10.00", "20.00", "30.00"]
    assert len(response.queries) == 2, response.query_log


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


def test_reservation_unit__query__price_summary__through_foreign_key(graphql):
    today = local_date()
    for amount in (Decimal("12.50"), Decimal(20), Decimal(30)):
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
            price_unit=PriceUnit.PER_HOUR,
        )
        ReservationFactory.create(reservation_unit=reservation_unit)

    graphql.login_with_superuser()
    query = reservations_query(fields=f"pk reservationUnit {{ {FIELDS} }}")
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.node(0)["reservationUnit"] == {
        "priceSummary": {
            "isFree": False,
            "lowestAmount": "12.50",
            "priceUnit": PriceUnit.PER_HOUR.value,
            "varies": False,
            "canApplyForDiscount": False,
        },
    }
    assert [response.node(index)["reservationUnit"]["priceSummary"]["lowestAmount"] for index in range(3)] == [
        "12.50",
        "20.00",
        "30.00",
    ]
    assert len(response.queries) == 6, response.query_log


# ── Tax percentage ──


def test_reservation_unit__query__price_summary__tax_percentage_of_the_cheapest_price(graphql):
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
        tax_level=TaxLevelFactory.create(rates__percentage=Decimal("25.5")),
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        price_option=PriceOptionFactory.create(unit_group=unit_group),
        amount=Decimal(15),
        tax_level=TaxLevelFactory.create(rates__percentage=Decimal(14)),
    )

    query = reservation_unit_query(fields=TAX_FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceSummary": {"lowestAmount": "15.00", "taxPercentage": "14.00"}}


def test_reservation_unit__query__price_summary__tax_percentage_of_today(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    tax_level = TaxLevelFactory.create(
        rates__percentage=Decimal(24), rates__begins=today - datetime.timedelta(days=100)
    )
    TaxLevelRateFactory.create(
        tax_level=tax_level, begins=today + datetime.timedelta(days=10), percentage=Decimal("25.5")
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal(20),
        tax_level=tax_level,
    )

    query = reservation_unit_query(fields=TAX_FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceSummary": {"lowestAmount": "20.00", "taxPercentage": "24.00"}}


def test_reservation_unit__query__price_summary__tax_percentage_without_rate(graphql):
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
        amount=Decimal(20),
        tax_level=TaxLevelFactory.create(rates=[]),
    )

    query = reservation_unit_query(fields=TAX_FIELDS, id=to_global_id("ReservationUnitNode", reservation_unit.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {"priceSummary": {"lowestAmount": "20.00", "taxPercentage": None}}


# ── Material price ──


def test_reservation_unit__query__price_summary__material_price(graphql):
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
        amount=Decimal(0),
        material_price_description_fi="<p>Materiaalit</p>",
        material_price_description_en="<p>Materials</p>",
        material_price_description_sv="<p>Material</p>",
    )

    query = reservation_unit_query(
        fields=MATERIAL_PRICE_FIELDS,
        id=to_global_id("ReservationUnitNode", reservation_unit.pk),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "priceSummary": {
            "isFree": True,
            "materialPriceDescriptionFi": "<p>Materiaalit</p>",
            "materialPriceDescriptionEn": "<p>Materials</p>",
            "materialPriceDescriptionSv": "<p>Material</p>",
        },
    }


def test_reservation_unit__query__price_summary__no_material_price(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=today - datetime.timedelta(days=10))

    query = reservation_unit_query(
        fields=MATERIAL_PRICE_FIELDS,
        id=to_global_id("ReservationUnitNode", reservation_unit.pk),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["priceSummary"]["materialPriceDescriptionFi"] == ""


def test_reservation_unit__query__price_summary__material_price_of_the_cheapest_option_that_has_one(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    for amount, material_price in ((Decimal(10), ""), (Decimal(20), "B"), (Decimal(30), "C")):
        PriceComponentFactory.create(
            pricing_group=pricing_group,
            valid_from=today - datetime.timedelta(days=10),
            price_option=PriceOptionFactory.create(unit_group=unit_group),
            amount=amount,
            material_price_description_fi=material_price,
        )

    query = reservation_unit_query(
        fields=MATERIAL_PRICE_FIELDS,
        id=to_global_id("ReservationUnitNode", reservation_unit.pk),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["priceSummary"]["materialPriceDescriptionFi"] == "B"


def test_reservation_unit__query__price_summary__material_price_without_finnish(graphql):
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
        material_price_description_fi="",
        material_price_description_en="<p>Materials</p>",
        material_price_description_sv="",
    )

    query = reservation_unit_query(
        fields=MATERIAL_PRICE_FIELDS,
        id=to_global_id("ReservationUnitNode", reservation_unit.pk),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object["priceSummary"]["materialPriceDescriptionFi"] == ""
    assert response.first_query_object["priceSummary"]["materialPriceDescriptionEn"] == "<p>Materials</p>"
